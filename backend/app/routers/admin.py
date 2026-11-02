import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, RescueReport, RescueStatusHistory, Organization, ResponderAvailability, Notification
from app.schemas import RescueCaseOut, PartnerApplicationOut, PartnerReviewAction
from app.auth import require_admin
from app.routers.reports import build_case_response

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

def format_application(u: User) -> dict:
    capabilities = []
    if u.rescue_capabilities:
        try:
            capabilities = json.loads(u.rescue_capabilities)
        except Exception:
            capabilities = [c.strip() for c in u.rescue_capabilities.split(",") if c.strip()]

    specs = []
    if u.specializations:
        try:
            specs = json.loads(u.specializations)
        except Exception:
            specs = [s.strip() for s in u.specializations.split(",") if s.strip()]

    return {
        "id": u.id,
        "fullName": u.full_name,
        "email": u.email,
        "phone": u.phone,
        "role": u.role,
        "city": u.city,
        "organizationName": u.organization_name,
        "verificationStatus": u.verification_status,
        "experienceYears": u.experience_years or 0,
        "rescueCapabilities": capabilities,
        "clinicName": u.clinic_name,
        "clinicAddress": u.clinic_address,
        "licenseNumber": u.license_number,
        "specializations": specs,
        "emergency247": u.emergency_24_7 or False,
        "rejectionReason": u.rejection_reason,
        "isTestAccount": u.is_test_account or False,
        "createdAt": u.created_at,
    }

@router.post("/reports/{case_id}/verify", response_model=RescueCaseOut)
def verify_report(
    case_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    clean_id = case_id.strip().upper()
    report = db.query(RescueReport).filter(RescueReport.case_id == clean_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {clean_id} not found."
        )

    report.verified = True
    report.updated_at = datetime.utcnow()

    history = RescueStatusHistory(
        rescue_report_id=report.id,
        status=report.status,
        updated_by=current_user.full_name,
        notes="Emergency details and location coordinates authenticated by triage lead."
    )
    db.add(history)
    db.commit()
    db.refresh(report)

    return build_case_response(report, db)

@router.get("/applications", response_model=List[PartnerApplicationOut])
def get_partner_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    role_filter: Optional[str] = Query(None, alias="role"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role.in_(["rescuer", "vet", "ngo"]))
    if status_filter and status_filter != "all":
        query = query.filter(User.verification_status == status_filter)
    if role_filter and role_filter != "all":
        query = query.filter(User.role == role_filter)

    users = query.order_by(User.created_at.desc()).all()
    return [format_application(u) for u in users]

@router.post("/applications/{user_id}/approve")
def approve_partner_application(
    user_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Partner application not found.")

    user.verification_status = "verified"
    user.reviewed_by = current_user.full_name
    user.reviewed_at = datetime.utcnow()

    # If rescuer, set their duty availability to available
    if user.role == "rescuer":
        avail = db.query(ResponderAvailability).filter(ResponderAvailability.rescuer_id == user.id).first()
        if avail:
            avail.availability_status = "available"
            avail.updated_at = datetime.utcnow()
        else:
            new_avail = ResponderAvailability(
                rescuer_id=user.id,
                availability_status="available",
                service_area=user.city
            )
            db.add(new_avail)

    # If organization exists for user, approve it too
    org = db.query(Organization).filter(Organization.email == user.email).first()
    if org:
        org.verification_status = "verified"

    # Send in-app notification to approved partner
    notif = Notification(
        recipient_id=user.id,
        notification_type="partner_approved",
        title="Accreditation Approved!",
        message=f"Congratulations {user.full_name}! Your official PawSOS partner accreditation has been verified by {current_user.full_name}. You are now active for emergency dispatches."
    )
    db.add(notif)
    db.commit()

    return {"success": True, "message": f"{user.full_name} ({user.role}) has been officially verified."}

@router.post("/applications/{user_id}/reject")
def reject_partner_application(
    user_id: str,
    action: PartnerReviewAction,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Partner application not found.")

    user.verification_status = "rejected"
    user.rejection_reason = action.reason or "Application did not meet minimum accreditation requirements."
    user.reviewed_by = current_user.full_name
    user.reviewed_at = datetime.utcnow()

    # Notify applicant
    notif = Notification(
        recipient_id=user.id,
        notification_type="partner_rejected",
        title="Application Status Update",
        message=f"Your accreditation application was not approved at this time. Reason: {user.rejection_reason}"
    )
    db.add(notif)
    db.commit()

    return {"success": True, "message": f"Application for {user.full_name} rejected."}

@router.post("/applications/{user_id}/request-info")
def request_partner_info(
    user_id: str,
    action: PartnerReviewAction,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Partner application not found.")

    notif = Notification(
        recipient_id=user.id,
        notification_type="info_requested",
        title="Additional Verification Information Needed",
        message=action.message or f"Administrator {current_user.full_name} has requested additional credentials or clinic documentation to complete your verification."
    )
    db.add(notif)
    db.commit()

    return {"success": True, "message": f"Information request sent to {user.full_name}."}
