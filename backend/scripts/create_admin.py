#!/usr/bin/env python3
"""
PawSOS Administrator Provisioning Script
Usage:
    python scripts/create_admin.py --name "Command Admin" --email "admin@pawsos.org" --phone "+91 99000 00000" --password "SecureAdminPassword123!"
"""
import sys
import argparse
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

def provision_admin(full_name: str, email: str, phone: str, password: str, city: str = "Central Command"):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email.lower()).first()
        if existing:
            print(f"[ERROR]: User with email {email} already exists.")
            sys.exit(1)

        admin = User(
            full_name=full_name,
            email=email.lower(),
            phone=phone,
            password_hash=get_password_hash(password),
            role="admin",
            verification_status="verified",
            city=city,
            is_test_account=False,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"[SUCCESS]: Administrator account created successfully:")
        print(f"  ID: {admin.id}")
        print(f"  Name: {admin.full_name}")
        print(f"  Email: {admin.email}")
        print(f"  Role: {admin.role}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Provision a PawSOS Administrator Account")
    parser.add_argument("--name", required=True, help="Full name of administrator")
    parser.add_argument("--email", required=True, help="Administrator email address")
    parser.add_argument("--phone", required=True, help="Administrator phone number")
    parser.add_argument("--password", required=True, help="Administrator password (min 8 chars)")
    parser.add_argument("--city", default="Central Command", help="Operational city / sector")

    args = parser.parse_args()
    provision_admin(args.name, args.email, args.phone, args.password, args.city)
