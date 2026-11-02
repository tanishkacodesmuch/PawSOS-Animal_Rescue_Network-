# PawSOS — Backend Architecture & Deployment Guide

> **Animal Emergency & Rescue Network**  
> *One Report. One Response. One Animal Closer to Care.*

This directory contains the production-grade **Python FastAPI** backend for PawSOS, architected for **PostgreSQL via Supabase** and **Supabase Storage** for emergency animal incident photographs.

---

## 1. Architecture Overview

- **Framework**: FastAPI (Asynchronous Python 3.10+)
- **ORM / Database**: SQLAlchemy 2.0 with PostgreSQL (`asyncpg` / `psycopg2-binary`)
- **Managed Database & Auth**: Supabase PostgreSQL + Row Level Security (RLS)
- **Object Storage**: Supabase Storage (`rescue-photos` bucket)
- **Database Migrations**: Alembic (`001_initial_schema`, `002_partner_onboarding_and_handoff`)
- **Authentication & RBAC**: JWT tokens (HMAC-SHA256) with PBKDF2 / bcrypt password hashing
- **Testing**: Pytest with SQLite in-memory engine & FastAPI `TestClient`

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry & CORS middleware
│   ├── config.py            # Pydantic Settings & environment variables
│   ├── database.py          # SQLAlchemy engine, session maker, get_db dependency
│   ├── models.py            # SQLAlchemy relational models (8 tables + partner fields)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── auth.py              # Password hashing, JWT creation & role verification
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # /api/auth (register, login, me, in-app notifications)
│       ├── reports.py       # /api/reports (submit, tracking, status updates, list)
│       ├── assignments.py   # /api/assignments (dispatch, accept, reject, vet handoff)
│       ├── veterinary.py    # /api/veterinary (inpatient intake, clinical diagnosis & charts)
│       ├── admin.py         # /api/admin (verification queue, partner approvals, info requests)
│       ├── analytics.py     # /api/analytics (live rescue statistics)
│       ├── storage.py       # /api/storage (Supabase photo bucket uploads)
│       └── test_mode.py     # /api/test (isolated test accounts and cleanup)
├── alembic/
│   ├── env.py               # Alembic environment runner
│   ├── script.py.mako       # Migration template
│   └── versions/
│       ├── 001_initial_schema.py
│       └── 002_partner_onboarding_and_handoff.py
├── database/
│   └── schema.sql           # Raw PostgreSQL DDL with RLS policies & triggers
├── scripts/
│   └── create_admin.py      # Secure CLI script for administrator provisioning
├── tests/
│   ├── conftest.py          # Test fixtures and in-memory DB configuration
│   ├── test_auth.py         # Registration, role gating, login tests
│   └── test_reports.py      # End-to-end incident, approval, and vet care tests
├── alembic.ini              # Alembic config
├── requirements.txt         # Pinned Python package dependencies
├── .env.example             # Environment configuration template
└── README.md                # This setup guide
```

---

## 2. Administrator Provisioning Instructions

In production, administrators **must never be created via public registration**. Use one of the two secure methods below:

### Method A: Python CLI Provisioning Script
Run the provisioning utility directly from the backend directory:
```bash
python scripts/create_admin.py \
  --name "Command Dispatch Lead" \
  --email "admin@pawsos.org" \
  --phone "+91 99000 00000" \
  --password "SuperSecureAdminPassword2026!" \
  --city "Central Command Mumbai"
```

### Method B: Direct SQL Query in Supabase
Run the following SQL snippet in the Supabase SQL Editor:
```sql
INSERT INTO users (
    id, full_name, email, phone, password_hash, role, verification_status, city
) VALUES (
    uuid_generate_v4(),
    'Lead Dispatch Administrator',
    'admin@pawsos.org',
    '+91 99000 00000',
    -- Computed SHA-512 PBKDF2 hash
    'your-generated-password-hash',
    'admin',
    'verified',
    'Mumbai Command'
);
```

---

## 3. Partner Onboarding & Accreditation System

1. **Registration**:
   - **Citizens**: Verified immediately on sign-up; can report emergencies and track cases.
   - **Rescuers**: Register with years of experience, specific handling capabilities (`Dogs`, `Cats`, `Large Animals`, `First Aid`, `Aggressive Animals`), and service sector. They initially receive `verification_status = 'pending'` and **cannot** be dispatched or go on duty until an administrator approves them.
   - **Veterinarians / Clinics**: Register with clinic name, address, veterinary council license number, emergency 24/7 intake flag, and clinical specializations. They initially receive `verification_status = 'pending'`.
2. **Administrative Approval**:
   - Administrators open the **Partner Approvals** tab in the Admin Dashboard.
   - For each applicant, they inspect credentials, license number, and experience.
   - Actions available: **Approve**, **Reject** (with reason), or **Request Additional Info**.
   - Upon approval, the rescuer is automatically activated for emergency dispatches, and an in-app notification is sent to their inbox.

---

## 4. End-to-End Testing Guided Workflow (Safe Test Mode)

PawSOS provides an isolated **Safe Test Mode** so you can evaluate the entire six-stage rescue workflow without fake or demonstration data in production:

1. **Activate Test Mode**: Click the **Test Mode** badge in the navbar header.
2. **Seed Sample Test Accounts**: Click **"Seed Isolated Test Accounts"** on the login page or in the Admin Dashboard banner. This creates:
   - `test.citizen@pawsos.local` (Verified Citizen)
   - `test.admin@pawsos.local` (Verified Administrator)
   - `test.rescuer@pawsos.local` (Pending Rescuer — Ravi)
   - `test.vet@pawsos.local` (Pending Veterinarian — Dr. Sneha Roy)
   - `test.ngo@pawsos.local` (Pending Shelter Haven)
   - Default Password: `TestPassword123!`
3. **Walkthrough Steps**:
   - **Step 1 (Citizen)**: Sign in as `test.citizen@pawsos.local`. Open "Report SOS", click "Fill Sample Test Case", and submit. A unique Case ID (e.g., `TEST-4921`) is generated.
   - **Step 2 (Admin)**: Sign in as `test.admin@pawsos.local`. Open the Admin Dashboard.
     - View the report in the queue and click **"Verify Authenticity"**.
     - Notice that no rescuers are available yet because the test rescuer is pending!
     - Switch to the **"Partner Approvals"** tab.
     - View **Test Rescuer Ravi**, review his 4-year experience and capabilities, and click **"Approve"**.
     - View **Dr. Sneha Roy (PawCare Clinic)** and click **"Approve"**.
   - **Step 3 (Dispatch)**: Switch back to **"Emergency Operations"**. Ravi now appears in the eligible rescuer dropdown! Select Ravi and click **"Dispatch Rescuer"**.
   - **Step 4 (Rescuer)**: Sign in as `test.rescuer@pawsos.local`.
     - Notice the in-app notification: *"🚨 New Emergency Dispatch Assigned"*.
     - Open the Responder Dashboard. Under "New Dispatches", click **"Accept Case"**.
     - Click **"Open GPS Directions"** to preview navigation.
     - Click **"Depart (On the Way)"**, then **"Confirm Animal Rescued"**.
     - Click **"Initiate Veterinary Clinic Handoff"**, select **PawCare Veterinary Hospital**, and submit transfer.
   - **Step 5 (Veterinarian)**: Sign in as `test.vet@pawsos.local`.
     - Open the Vet Dashboard. The patient alert appears under "Incoming Patient Alerts".
     - Click **"Admit Patient to Clinic"**.
     - Enter diagnosis (*"Compound fracture of left radius"*), treatment protocol, select *"Stable - In Recovery"*, and click **"Save Clinical Record"**.
   - **Step 6 (Citizen Tracking)**: Open the public **Track Rescue** page for the case ID. All 6 stages (`REPORT → VERIFY → DISPATCH → RESCUE → TREAT → TRACK`) are displayed with real timestamps and clinical chart notes.

---

## 5. PostgreSQL & Supabase Database Configuration

### Step 1: Connect Connection String
In Supabase, navigate to **Project Settings > Database > Connection string > URI**. Copy the URI and set it in `backend/.env`:
```ini
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUz..."
SUPABASE_STORAGE_BUCKET="rescue-photos"
SECRET_KEY="generate-a-strong-random-32-byte-hex-string"
```

### Step 2: Run Alembic Migrations
```bash
alembic upgrade head
```
This runs:
- `001_initial_schema`: Initial 8 tables with foreign keys and indexes.
- `002_partner_onboarding_and_handoff`: Adds partner accreditation fields, assignment rejection reasons, veterinary handoff columns, and in-app notifications.

---

## 6. Running Automated Tests

Run the backend test suite using `pytest`:
```bash
pytest -v
```
Test suite validates:
- Standard citizen auto-verification.
- Rescuer and Vet registration initially receiving `pending` status.
- Exclusion of unverified or off-duty rescuers from dispatch availability.
- Administrator approval activating duty status.
- Rescuer assignment acceptance and decline handling.
- Clinical veterinary records logging and public case tracking.

---

## 7. Status of System Capabilities

| Feature / Workflow | Implementation Status | Notes |
|---|---|---|
| **Partner Accreditation** | Completed | Full admin approvals dashboard, rejection reasons, and info requests. |
| **Rescuer Registration** | Completed | Collects years of experience, handling capabilities, service area, and starts `pending`. |
| **Veterinary Registration** | Completed | Collects clinic address, license number, emergency 24/7 flag, specializations. |
| **Rescuer Availability** | Completed | Only verified, on-duty rescuers returned; phone numbers masked for privacy. |
| **Rescuer Workflow** | Completed | Accept, decline, GPS navigation directions, status progression, handoff. |
| **Veterinary Workflow** | Completed | Inpatient admission, clinical charts, diagnosis/medication protocol, recovery tracking. |
| **In-App Notifications** | Completed | Emergency dispatch alerts, accreditation updates, clinic arrival notifications. |
| **Safe Test Mode** | Completed | Toggleable isolated environment with sample account seeders and test data resets. |
| **Role-Based Security** | Completed | Endpoints in both Express and FastAPI enforce JWT auth and role/ownership checks. |
| **PostgreSQL & Alembic** | Completed | Complete SQL DDL and Alembic version 001 & 002 migrations provided. |
