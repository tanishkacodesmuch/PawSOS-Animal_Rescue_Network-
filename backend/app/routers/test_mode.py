import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, RescueReport, RescueAssignment, RescueStatusHistory, VeterinaryRecord, ResponderAvailability, Organization, Notification
from app.auth import get_password_hash

router = APIRouter(prefix="/test", tags=["Safe Test Mode"])

TEST_PASSWORD = "TestPassword123!"

@router.get("/status")
def get_test_status(db: Session = Depends(get_db)):
    test_users_count = db.query(User).filter(User.is_test_account == True).count()
    test_cases_count = db.query(RescueReport).filter(RescueReport.is_test_case == True).count()
    return {
        "testModeAvailable": True,
        "testAccountsLoaded": test_users_count > 0,
        "testAccountsCount": test_users_count,
        "testCasesCount": test_cases_count
    }

@router.post("/seed-accounts")
def seed_test_accounts(db: Session = Depends(get_db)):
    """
    Creates isolated TEST accounts for end-to-end evaluation.
    All accounts are strictly marked is_test_account=True.
    Test Rescuer and Vet initially have verification_status='pending'
    so the administrator can test the verification workflow!
    """
    # Check if already seeded
    existing = db.query(User).filter(User.is_test_account == True).first()
    if existing:
        return {"success": True, "message": "Test accounts already exist."}

    password_hash = get_password_hash(TEST_PASSWORD)

    test_accounts = [
        {
            "full_name": "Test Citizen (TEST DATA)",
            "email": "test.citizen@pawsos.local",
            "phone": "+91 99000 00001",
            "role": "citizen",
            "verification_status": "verified",
            "city": "Mumbai Central",
        },
        {
            "full_name": "Test Admin Dispatcher (TEST DATA)",
            "email": "test.admin@pawsos.local",
            "phone": "+91 99000 00002",
            "role": "admin",
            "verification_status": "verified",
            "city": "Mumbai Command",
        },
        {
            "full_name": "Test Rescuer Ravi (TEST DATA)",
            "email": "test.rescuer@pawsos.local",
            "phone": "+91 99000 00003",
            "role": "rescuer",
            "verification_status": "pending", # Must be approved by admin!
            "city": "Bandra West",
            "experience_years": 4,
            "rescue_capabilities": '["Dogs", "Cats", "First Aid", "Emergency Transport"]',
            "organization_name": "Bandra Street Animal Rescue",
        },
        {
            "full_name": "Dr. Sneha Roy (TEST DATA)",
            "email": "test.vet@pawsos.local",
            "phone": "+91 99000 00004",
            "role": "vet",
            "verification_status": "pending", # Must be approved by admin!
            "city": "Bandra West",
            "clinic_name": "PawCare Veterinary Clinic (TEST)",
            "clinic_address": "45 Hill Road, Bandra West, Mumbai",
            "license_number": "MVC-2023-9842",
            "specializations": '["Emergency Trauma", "Surgery", "Orthopedics"]',
            "emergency_24_7": True,
        },
        {
            "full_name": "Test Shelter Haven (TEST DATA)",
            "email": "test.ngo@pawsos.local",
            "phone": "+91 99000 00005",
            "role": "ngo",
            "verification_status": "pending",
            "city": "Andheri East",
            "organization_name": "Safe Haven Animal Shelter (TEST)",
        }
    ]

    created = []
    for acc in test_accounts:
        user = User(
            full_name=acc["full_name"],
            email=acc["email"],
            phone=acc["phone"],
            password_hash=password_hash,
            role=acc["role"],
            verification_status=acc["verification_status"],
            city=acc["city"],
            organization_name=acc.get("organization_name") or acc.get("clinic_name"),
            experience_years=acc.get("experience_years", 0),
            rescue_capabilities=acc.get("rescue_capabilities"),
            clinic_name=acc.get("clinic_name"),
            clinic_address=acc.get("clinic_address"),
            license_number=acc.get("license_number"),
            specializations=acc.get("specializations"),
            emergency_24_7=acc.get("emergency_24_7", False),
            is_test_account=True,
        )
        db.add(user)
        db.flush()

        if user.role == "rescuer":
            avail = ResponderAvailability(
                rescuer_id=user.id,
                availability_status="pending_verification",
                service_area=user.city
            )
            db.add(avail)

        if user.clinic_name or user.organization_name:
            org = Organization(
                organization_name=user.clinic_name or user.organization_name,
                organization_type="Veterinary Clinic" if user.role == "vet" else "NGO & Shelter",
                address=user.clinic_address or user.city,
                service_area=user.city,
                verification_status="pending",
                contact_phone=user.phone,
                email=user.email
            )
            db.add(org)

        created.append({"role": user.role, "email": user.email})

    db.commit()
    return {
        "success": True,
        "message": "Sample TEST accounts generated. Default password: TestPassword123!",
        "accounts": created,
        "password": TEST_PASSWORD
    }

@router.post("/reset")
def reset_test_data(db: Session = Depends(get_db)):
    """
    Cleans up only TEST accounts and TEST cases.
    Real emergency cases and real accounts are never touched.
    """
    # Delete test reports and cascaded records
    test_reports = db.query(RescueReport).filter(RescueReport.is_test_case == True).all()
    for tr in test_reports:
        db.delete(tr)

    # Delete test users
    test_users = db.query(User).filter(User.is_test_account == True).all()
    for tu in test_users:
        db.delete(tu)

    # Delete test organizations
    test_orgs = db.query(Organization).filter(Organization.organization_name.ilike("%(TEST)%")).all()
    for to in test_orgs:
        db.delete(to)

    db.commit()
    return {"success": True, "message": "All test mode data removed cleanly."}
