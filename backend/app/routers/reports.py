import random
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, RescueReport, RescueStatusHistory, RescueAssignment, VeterinaryRecord, Notification
from app.schemas import ReportCreate, RescueCaseOut, StatusUpdate
from app.auth import get_current_user_optional, get_current_user

router = APIRouter(prefix="/reports", tags=["Rescue Reports"])

def build_case_response(report: RescueReport, db: Session) -> dict:
    timeline = db.query(RescueStatusHistory).filter(
        RescueStatusHistory.rescue_report_id == report.id
    ).order_by(RescueStatusHistory.created_at.asc()).all()

    timeline_data = [
        {
            "id": h.id,
            "stage": h.status,
            "timestamp": h.created_at,
            "title": f"Stage: {h.status}",
            "description": h.notes,
            "actor": h.updated_by
        }
        for h in timeline
    ]

    assigned_rescuer = None
    assignment = db.query(RescueAssignment).filter(
        RescueAssignment.rescue_report_id == report.id
    ).first()

    if assignment:
        rescuer_user = db.query(User).filter(User.id == assignment.rescuer_id).first()
        if rescuer_user:
            assigned_rescuer = {
                "id": rescuer_user.id,
                "name": rescuer_user.full_name,
                "phone": rescuer_user.phone,
                "city": rescuer_user.city,
                "assignmentStatus": assignment.assignment_status,
                "assignedAt": assignment.assigned_at,
                "etaMinutes": 15 if assignment.assignment_status == "accepted" else None,
                "rejectionReason": assignment.rejection_reason
            }

    vet_record_data = None
    vet_rec = db.query(VeterinaryRecord).filter(
        VeterinaryRecord.rescue_report_id == report.id
    ).first()

    if vet_rec:
        vet_record_data = {
            "id": vet_rec.id,
            "veterinarianId": vet_rec.veterinarian_id,
            "veterinarianName": vet_rec.veterinarian_name,
            "diagnosis": vet_rec.diagnosis,
            "treatment": vet_rec.treatment,
            "recoveryStatus": vet_rec.recovery_status,
            "updatedAt": vet_rec.updated_at
        }

    return {
        "id": report.id,
        "caseId": report.case_id,
        "reporterId": report.reporter_id,
        "animalType": report.animal_type,
        "condition": report.condition,
        "description": report.description,
        "photoUrl": report.photo_storage_path,
        "lat": report.latitude,
        "lng": report.longitude,
        "address": report.address,
        "landmark": report.landmark,
        "urgency": report.urgency,
        "status": report.status,
        "verified": report.verified,
        "reportedAt": report.created_at,
        "updatedAt": report.updated_at,
        "reporter": {
            "name": "Anonymous Good Samaritan" if report.is_anonymous else (report.reporter_name or "Citizen"),
            "phone": "Protected" if report.is_anonymous else (report.reporter_phone or "Not provided"),
            "anonymous": report.is_anonymous
        },
        "assignedRescuer": assigned_rescuer,
        "assignedClinicId": report.assigned_clinic_id,
        "assignedClinicName": report.assigned_clinic_name,
        "handoffStatus": report.handoff_status,
        "isTestCase": report.is_test_case or False,
        "veterinaryRecord": vet_record_data,
        "timeline": timeline_data
    }

@router.post("", response_model=RescueCaseOut, status_code=status.HTTP_201_CREATED)
def create_report(
    report_in: ReportCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    case_id = f"AER-{random.randint(1000, 9999)}"
    reporter_id = current_user.id if current_user else None

    new_report = RescueReport(
        case_id=case_id,
        reporter_id=reporter_id,
        animal_type=report_in.animalType,
        condition=report_in.condition,
        description=report_in.description,
        photo_storage_path=report_in.photoUrl,
        latitude=report_in.lat,
        longitude=report_in.lng,
        address=report_in.address,
        landmark=report_in.landmark,
        urgency=report_in.urgency,
        status="Reported",
        verified=False,
        reporter_name=report_in.reporterName if not report_in.isAnonymous else "Anonymous Good Samaritan",
        reporter_phone=report_in.reporterPhone if not report_in.isAnonymous else "Not provided",
        is_anonymous=report_in.isAnonymous or False,
        is_test_case=report_in.isTestCase or False,
    )
    db.add(new_report)
    db.flush()

    history = RescueStatusHistory(
        rescue_report_id=new_report.id,
        status="Reported",
        updated_by=report_in.reporterName or "Citizen",
        notes="Emergency incident dispatched to central coordination system."
    )
    db.add(history)
    db.commit()
    db.refresh(new_report)

    return build_case_response(new_report, db)

@router.get("", response_model=List[RescueCaseOut])
def get_reports(
    status: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    animal_type: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(RescueReport)
    if status and status != "all":
        query = query.filter(RescueReport.status == status)
    if urgency and urgency != "all":
        query = query.filter(RescueReport.urgency == urgency)
    if animal_type and animal_type != "all":
        query = query.filter(RescueReport.animal_type == animal_type)
    if city:
        query = query.filter(RescueReport.address.ilike(f"%{city}%"))

    reports = query.order_by(RescueReport.created_at.desc()).all()
    return [build_case_response(r, db) for r in reports]

@router.get("/my", response_model=List[RescueCaseOut])
def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "rescuer":
        # Return reports assigned to this rescuer
        assignments = db.query(RescueAssignment).filter(RescueAssignment.rescuer_id == current_user.id).all()
        report_ids = [a.rescue_report_id for a in assignments]
        reports = db.query(RescueReport).filter(RescueReport.id.in_(report_ids)).order_by(RescueReport.updated_at.desc()).all()
    else:
        reports = db.query(RescueReport).filter(
            RescueReport.reporter_id == current_user.id
        ).order_by(RescueReport.created_at.desc()).all()

    return [build_case_response(r, db) for r in reports]

@router.get("/{case_id}", response_model=RescueCaseOut)
def get_report_by_case_id(case_id: str, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper()
    report = db.query(RescueReport).filter(RescueReport.case_id == clean_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No rescue report found matching Case ID {clean_id}."
        )
    return build_case_response(report, db)

@router.patch("/{case_id}/status", response_model=RescueCaseOut)
def update_report_status(
    case_id: str,
    update_in: StatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clean_id = case_id.strip().upper()
    report = db.query(RescueReport).filter(RescueReport.case_id == clean_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case {clean_id} not found."
        )

    # Authorization Check
    if current_user.role == "rescuer":
        # Must be assigned to this case
        assignment = db.query(RescueAssignment).filter(
            RescueAssignment.rescue_report_id == report.id,
            RescueAssignment.rescuer_id == current_user.id
        ).first()
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot update status for a case that is not assigned to you."
            )
        if update_in.status not in ["On the Way", "Rescued"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rescuers can only transition cases to 'On the Way' or 'Rescued'. Received: {update_in.status}"
            )
    elif current_user.role == "vet":
        if update_in.status not in ["Treated", "Closed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Veterinary doctors can only transition cases to 'Treated' or 'Closed'."
            )
    elif current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have authorization to modify operational case status."
        )

    report.status = update_in.status
    report.updated_at = datetime.utcnow()
    actor = f"{current_user.full_name} ({current_user.role.title()})"

    history_entry = RescueStatusHistory(
        rescue_report_id=report.id,
        status=update_in.status,
        updated_by=actor,
        notes=update_in.notes or f"Emergency operation moved to {update_in.status} by {actor}."
    )
    db.add(history_entry)

    # Notify reporter if registered
    if report.reporter_id:
        notif = Notification(
            recipient_id=report.reporter_id,
            rescue_report_id=report.id,
            case_id=report.case_id,
            notification_type="status_change",
            title=f"Case {report.case_id} Update: {update_in.status}",
            message=f"Your reported case has progressed to {update_in.status}. {update_in.notes or ''}"
        )
        db.add(notif)

    db.commit()
    db.refresh(report)

    return build_case_response(report, db)
