import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    User,
    RescueReport,
    RescueAssignment,
    RescueStatusHistory,
    ResponderAvailability,
    Organization,
    Notification,
)
from app.schemas import (
    AssignmentCreate,
    AssignmentReject,
    RescuerAvailabilityOut,
    AvailabilityUpdate,
    VeterinaryHandoffCreate,
)
from app.auth import get_current_user, require_admin, require_rescuer

router = APIRouter(tags=["Assignments & Responders"])

def mask_phone(phone: str) -> str:
    if not phone or len(phone) < 4:
        return "Protected"
    return f"{phone[:3]} •••• {phone[-4:]}"

@router.get("/rescuers/available", response_model=List[RescuerAvailabilityOut])
def get_available_rescuers(
    service_area: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns only accounts that are:
    - Registered as rescuers
    - Administratively verified (verification_status == 'verified')
    - Currently available (availability_status == 'available')
    - Private phone numbers are masked for security
    """
    query = (
        db.query(User, ResponderAvailability)
        .join(ResponderAvailability, User.id == ResponderAvailability.rescuer_id)
        .filter(
            User.role == "rescuer",
            User.verification_status == "verified",
            ResponderAvailability.availability_status == "available"
        )
    )

    if service_area:
        query = query.filter(
            (ResponderAvailability.service_area.ilike(f"%{service_area}%")) |
            (User.city.ilike(f"%{service_area}%"))
        )

    rows = query.all()
    results = []
    for user, avail in rows:
        caps = []
        if user.rescue_capabilities:
            try:
                caps = json.loads(user.rescue_capabilities)
            except Exception:
                caps = [c.strip() for c in user.rescue_capabilities.split(",") if c.strip()]

        results.append({
            "rescuerId": user.id,
            "name": user.full_name,
            "maskedPhone": mask_phone(user.phone),
            "availabilityStatus": avail.availability_status,
            "serviceArea": avail.service_area or user.city,
            "experienceYears": user.experience_years or 0,
            "capabilities": caps,
            "isVerified": True,
            "updatedAt": avail.updated_at or user.created_at,
        })
    return results

@router.post("/rescuers/availability")
def update_availability(
    avail_in: AvailabilityUpdate,
    current_user: User = Depends(require_rescuer),
    db: Session = Depends(get_db)
):
    # Only verified rescuers can set themselves to 'available'
    if current_user.verification_status != "verified" and avail_in.availabilityStatus == "available":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your rescuer profile is pending administrative verification. You cannot go on duty until verified."
        )

    avail = db.query(ResponderAvailability).filter(ResponderAvailability.rescuer_id == current_user.id).first()
    now = datetime.utcnow()
    if avail:
        avail.availability_status = avail_in.availabilityStatus
        if avail_in.serviceArea:
            avail.service_area = avail_in.serviceArea
        avail.updated_at = now
    else:
        avail = ResponderAvailability(
            rescuer_id=current_user.id,
            availability_status=avail_in.availabilityStatus,
            service_area=avail_in.serviceArea or current_user.city
        )
        db.add(avail)

    db.commit()
    db.refresh(avail)
    return {
        "rescuerId": current_user.id,
        "availabilityStatus": avail.availability_status,
        "serviceArea": avail.service_area,
        "updatedAt": avail.updated_at
    }

@router.post("/assignments")
def assign_rescuer(
    assignment_in: AssignmentCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Lookup report by UUID or case_id
    report = db.query(RescueReport).filter(
        (RescueReport.id == assignment_in.rescueReportId) | (RescueReport.case_id == assignment_in.rescueReportId.upper())
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Rescue report not found.")

    rescuer = db.query(User).filter(
        User.id == assignment_in.rescuerId,
        User.role == "rescuer"
    ).first()
    if not rescuer:
        raise HTTPException(status_code=404, detail="Rescuer profile not found.")

    if rescuer.verification_status != "verified":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot dispatch unverified rescuer {rescuer.full_name}. Please approve their credentials first."
        )

    # Check for active existing assignment
    existing = db.query(RescueAssignment).filter(
        RescueAssignment.rescue_report_id == report.id,
        RescueAssignment.assignment_status.in_(["assigned", "accepted"])
    ).first()

    now = datetime.utcnow()
    if existing:
        existing.rescuer_id = rescuer.id
        existing.assignment_status = "assigned"
        existing.assigned_at = now
        existing.rejection_reason = None
        assignment_id = existing.id
    else:
        new_assignment = RescueAssignment(
            rescue_report_id=report.id,
            rescuer_id=rescuer.id,
            assignment_status="assigned",
            assigned_at=now
        )
        db.add(new_assignment)
        db.flush()
        assignment_id = new_assignment.id

    report.status = "Assigned"
    report.verified = True
    report.updated_at = now

    # Add status history
    history = RescueStatusHistory(
        rescue_report_id=report.id,
        status="Assigned",
        updated_by=current_user.full_name,
        notes=f"Dispatched by {current_user.full_name} to field responder {rescuer.full_name}."
    )
    db.add(history)

    # In-App Notification to Rescuer
    notif = Notification(
        recipient_id=rescuer.id,
        rescue_report_id=report.id,
        case_id=report.case_id,
        notification_type="emergency_dispatch",
        title="🚨 New Emergency Dispatch Assigned",
        message=f"Urgent case {report.case_id} ({report.animal_type} - {report.urgency}) near {report.address}. Please accept immediately to start navigation."
    )
    db.add(notif)
    db.commit()

    return {
        "success": True,
        "assignmentId": str(assignment_id),
        "reportId": str(report.id),
        "caseId": report.case_id
    }

@router.post("/assignments/{assignment_id}/accept")
def accept_assignment(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = db.query(RescueAssignment).filter(RescueAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment record not found.")

    # Authorization: Only the assigned rescuer can accept
    if assignment.rescuer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only accept assignments dispatched to your account.")

    now = datetime.utcnow()
    assignment.assignment_status = "accepted"
    assignment.accepted_at = now

    report = db.query(RescueReport).filter(RescueReport.id == assignment.rescue_report_id).first()
    if report:
        report.status = "Assigned"
        report.updated_at = now

        history = RescueStatusHistory(
            rescue_report_id=report.id,
            status="Assigned",
            updated_by=current_user.full_name,
            notes=f"Assignment accepted by responder {current_user.full_name}. Route opened."
        )
        db.add(history)

    db.commit()
    return {"success": True, "caseId": report.case_id if report else str(assignment.rescue_report_id)}

@router.post("/assignments/{assignment_id}/reject")
def reject_assignment(
    assignment_id: str,
    body: AssignmentReject,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = db.query(RescueAssignment).filter(RescueAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment record not found.")

    # Authorization: Only the assigned rescuer or an admin can reject
    if assignment.rescuer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only decline assignments dispatched to you.")

    now = datetime.utcnow()
    assignment.assignment_status = "rejected"
    assignment.rejection_reason = body.reason
    assignment.rejected_at = now

    report = db.query(RescueReport).filter(RescueReport.id == assignment.rescue_report_id).first()
    if report:
        # Return report to unassigned / triage queue
        report.status = "Reported"
        report.updated_at = now

        history = RescueStatusHistory(
            rescue_report_id=report.id,
            status="Reported",
            updated_by=current_user.full_name,
            notes=f"Assignment declined by responder ({body.reason}). Case returned to triage for reassignment."
        )
        db.add(history)

        # Notify admins that case needs reassignment
        admins = db.query(User).filter(User.role == "admin").all()
        for adm in admins:
            notif = Notification(
                recipient_id=adm.id,
                rescue_report_id=report.id,
                case_id=report.case_id,
                notification_type="assignment_rejected",
                title="⚠️ Case Assignment Declined",
                message=f"Responder {current_user.full_name} declined {report.case_id} ({body.reason}). Reassignment needed."
            )
            db.add(notif)

    db.commit()
    return {"success": True, "caseId": report.case_id if report else str(assignment.rescue_report_id)}

@router.post("/reports/{case_id}/handoff")
def initiate_veterinary_handoff(
    case_id: str,
    handoff_in: VeterinaryHandoffCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(RescueReport).filter(
        (RescueReport.case_id == case_id.upper()) | (RescueReport.id == case_id)
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Rescue report not found.")

    # Only assigned rescuer or admin can initiate veterinary handoff
    active_assignment = db.query(RescueAssignment).filter(
        RescueAssignment.rescue_report_id == report.id,
        RescueAssignment.assignment_status.in_(["assigned", "accepted"])
    ).first()

    if current_user.role != "admin" and (not active_assignment or active_assignment.rescuer_id != current_user.id):
        raise HTTPException(status_code=403, detail="Only the assigned rescuer or an administrator can initiate veterinary handoff.")

    clinic = db.query(Organization).filter(Organization.id == handoff_in.clinicId).first()
    if not clinic:
        # Try searching by user or name
        clinic_user = db.query(User).filter(User.id == handoff_in.clinicId, User.role == "vet").first()
        clinic_name = clinic_user.clinic_name if clinic_user else "Partner Veterinary Clinic"
    else:
        clinic_name = clinic.organization_name

    now = datetime.utcnow()
    report.assigned_clinic_id = clinic.id if clinic else None
    report.assigned_clinic_name = clinic_name
    report.handoff_status = "pending"
    report.updated_at = now

    history = RescueStatusHistory(
        rescue_report_id=report.id,
        status="Rescued",
        updated_by=current_user.full_name,
        notes=f"Animal secured and incoming transfer initiated to {clinic_name}. {handoff_in.notes or ''}"
    )
    db.add(history)

    # Notify vet partners in this clinic/city
    vet_users = db.query(User).filter(User.role == "vet", User.verification_status == "verified").all()
    for vu in vet_users:
        notif = Notification(
            recipient_id=vu.id,
            rescue_report_id=report.id,
            case_id=report.case_id,
            notification_type="veterinary_incoming",
            title="🐾 Incoming Rescued Animal",
            message=f"Case {report.case_id} ({report.animal_type}) is en route to {clinic_name} with responder {current_user.full_name}."
        )
        db.add(notif)

    db.commit()
    return {"success": True, "caseId": report.case_id, "clinicName": clinic_name}
