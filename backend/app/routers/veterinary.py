from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, RescueReport, VeterinaryRecord, RescueStatusHistory, Notification
from app.schemas import VeterinaryRecordCreate
from app.auth import get_current_user
from app.routers.reports import build_case_response

router = APIRouter(prefix="/veterinary", tags=["Veterinary Management"])

@router.get("/cases")
def get_veterinary_cases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["vet", "admin"]:
        raise HTTPException(status_code=403, detail="Access restricted to veterinary partners and administrators.")

    # Get cases that are either assigned to this vet's clinic, or in Rescued/Treated status
    reports = db.query(RescueReport).filter(
        RescueReport.status.in_(["Rescued", "Treated", "Closed"])
    ).order_by(RescueReport.updated_at.desc()).all()

    return [build_case_response(r, db) for r in reports]

@router.post("/cases/{case_id}/accept-handoff")
def accept_veterinary_handoff(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["vet", "admin"]:
        raise HTTPException(status_code=403, detail="Only veterinary doctors can accept animal handoffs.")

    if current_user.verification_status != "verified" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Your clinic account is pending administrative verification.")

    clean_id = case_id.strip().upper()
    report = db.query(RescueReport).filter(
        (RescueReport.case_id == clean_id) | (RescueReport.id == case_id)
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Rescue case not found.")

    now = datetime.utcnow()
    report.handoff_status = "accepted"
    report.status = "Rescued"
    report.updated_at = now

    clinic_name = current_user.clinic_name or current_user.organization_name or f"Dr. {current_user.full_name}'s Clinic"
    report.assigned_clinic_name = clinic_name

    history = RescueStatusHistory(
        rescue_report_id=report.id,
        status="Rescued",
        updated_by=current_user.full_name,
        notes=f"Animal received and admitted at {clinic_name}. Triage examination initiated."
    )
    db.add(history)

    # Notify reporter and admin
    if report.reporter_id:
        notif = Notification(
            recipient_id=report.reporter_id,
            rescue_report_id=report.id,
            case_id=report.case_id,
            notification_type="case_update",
            title="🐾 Animal Arrived at Veterinary Clinic",
            message=f"The rescued {report.animal_type} from Case {report.case_id} has been admitted at {clinic_name} for medical care."
        )
        db.add(notif)

    db.commit()
    return {"success": True, "caseId": report.case_id, "status": "Admitted"}

@router.post("/records")
def create_veterinary_record(
    record_in: VeterinaryRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["vet", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered veterinary professionals or administrators can log clinical treatments."
        )

    if current_user.verification_status != "verified" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your veterinary partner credentials are pending administrator verification."
        )

    report = db.query(RescueReport).filter(
        (RescueReport.id == record_in.rescueReportId) | (RescueReport.case_id == record_in.rescueReportId.upper())
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rescue report not found."
        )

    vet_name = current_user.full_name or "Attending Veterinarian"
    now = datetime.utcnow()

    existing_record = db.query(VeterinaryRecord).filter(
        VeterinaryRecord.rescue_report_id == report.id
    ).first()

    if existing_record:
        existing_record.veterinarian_id = current_user.id
        existing_record.veterinarian_name = vet_name
        existing_record.diagnosis = record_in.diagnosis
        existing_record.treatment = record_in.treatment
        existing_record.recovery_status = record_in.recoveryStatus or "Under Observation"
        existing_record.updated_at = now
        record_id = existing_record.id
    else:
        new_record = VeterinaryRecord(
            rescue_report_id=report.id,
            veterinarian_id=current_user.id,
            veterinarian_name=vet_name,
            diagnosis=record_in.diagnosis,
            treatment=record_in.treatment,
            recovery_status=record_in.recoveryStatus or "Under Observation"
        )
        db.add(new_record)
        db.flush()
        record_id = new_record.id

    # Advance report status to Treated (or Closed if discharged)
    if record_in.recoveryStatus == "Discharged / Closed":
        report.status = "Closed"
    else:
        report.status = "Treated"
    report.handoff_status = "completed"
    report.updated_at = now

    history = RescueStatusHistory(
        rescue_report_id=report.id,
        status=report.status,
        updated_by=f"Dr. {vet_name}",
        notes=f"Clinical Chart Updated: {record_in.diagnosis}. Protocol: {record_in.treatment}. Status: {record_in.recoveryStatus}"
    )
    db.add(history)

    # Notify reporter
    if report.reporter_id:
        notif = Notification(
            recipient_id=report.reporter_id,
            rescue_report_id=report.id,
            case_id=report.case_id,
            notification_type="case_update",
            title="🩺 Veterinary Treatment Updated",
            message=f"Medical update for {report.case_id}: {record_in.recoveryStatus}. Diagnosis: {record_in.diagnosis}"
        )
        db.add(notif)

    db.commit()

    return {
        "success": True,
        "recordId": str(record_id),
        "caseId": report.case_id,
        "status": report.status,
        "recoveryStatus": record_in.recoveryStatus
    }
