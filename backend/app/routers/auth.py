import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ResponderAvailability, Organization, Notification
from app.schemas import UserRegister, UserLogin, AuthResponse, UserProfileOut, NotificationOut
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def format_user_profile(user: User) -> dict:
    capabilities = []
    if user.rescue_capabilities:
        try:
            capabilities = json.loads(user.rescue_capabilities)
        except Exception:
            capabilities = [c.strip() for c in user.rescue_capabilities.split(",") if c.strip()]

    specs = []
    if user.specializations:
        try:
            specs = json.loads(user.specializations)
        except Exception:
            specs = [s.strip() for s in user.specializations.split(",") if s.strip()]

    return {
        "id": user.id,
        "fullName": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "verificationStatus": user.verification_status,
        "city": user.city,
        "organizationName": user.organization_name,
        "experienceYears": user.experience_years or 0,
        "rescueCapabilities": capabilities,
        "clinicName": user.clinic_name,
        "clinicAddress": user.clinic_address,
        "licenseNumber": user.license_number,
        "specializations": specs,
        "emergency247": user.emergency_24_7 or False,
        "isTestAccount": user.is_test_account or False,
        "createdAt": user.created_at,
    }

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Citizens are auto-verified; privileged roles require administrative accreditation
    verification_status = "verified" if user_in.role == "citizen" else "pending"

    caps_str = json.dumps(user_in.rescueCapabilities) if user_in.rescueCapabilities else None
    specs_str = json.dumps(user_in.specializations) if user_in.specializations else None

    new_user = User(
        full_name=user_in.fullName,
        email=user_in.email.lower(),
        phone=user_in.phone,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        verification_status=verification_status,
        city=user_in.city,
        organization_name=user_in.organizationName or user_in.clinicName,
        experience_years=user_in.experienceYears or 0,
        rescue_capabilities=caps_str,
        clinic_name=user_in.clinicName,
        clinic_address=user_in.clinicAddress,
        license_number=user_in.licenseNumber,
        specializations=specs_str,
        emergency_24_7=user_in.emergency247 or False,
        is_test_account=user_in.isTestAccount or False,
    )
    db.add(new_user)
    db.flush()

    # If registered as rescuer, create initial availability record (pending verification)
    if user_in.role == "rescuer":
        avail = ResponderAvailability(
            rescuer_id=new_user.id,
            availability_status="pending_verification" if verification_status == "pending" else "available",
            service_area=user_in.city,
        )
        db.add(avail)

    # If organization specified or veterinary clinic, create organization directory entry
    clinic_or_org_name = user_in.organizationName or user_in.clinicName
    if clinic_or_org_name and user_in.role in ["rescuer", "vet", "ngo"]:
        org_type_map = {
            "vet": "Veterinary Clinic",
            "ngo": "NGO & Shelter",
            "rescuer": "Rescuer"
        }
        org = Organization(
            organization_name=clinic_or_org_name,
            organization_type=org_type_map.get(user_in.role, "Rescuer"),
            address=user_in.clinicAddress or user_in.city,
            service_area=user_in.city,
            verification_status="pending",
            contact_phone=user_in.phone,
            email=user_in.email.lower()
        )
        db.add(org)

    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})

    return {
        "token": token,
        "user": format_user_profile(new_user)
    }

@router.post("/login", response_model=AuthResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return {
        "token": token,
        "user": format_user_profile(user)
    }

@router.get("/me", response_model=UserProfileOut)
def get_me(current_user: User = Depends(get_current_user)):
    return format_user_profile(current_user)

@router.get("/notifications")
def get_my_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(
        Notification.recipient_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()

    return [
        {
            "id": n.id,
            "recipientId": n.recipient_id,
            "rescueReportId": n.rescue_report_id,
            "caseId": n.case_id,
            "title": n.title or "Emergency Dispatch Notification",
            "notificationType": n.notification_type,
            "message": n.message,
            "readStatus": n.read_status,
            "createdAt": n.created_at,
        }
        for n in notifs
    ]

@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == current_user.id
    ).first()
    if notif:
        notif.read_status = True
        db.commit()
    return {"success": True}
