-- ==============================================================================
-- PAWSOS: ANIMAL EMERGENCY & RESCUE NETWORK
-- PRODUCTION POSTGRESQL / SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('citizen', 'rescuer', 'vet', 'ngo', 'admin')),
    city VARCHAR(100) NOT NULL,
    organization_name VARCHAR(255),
    experience_years INTEGER DEFAULT 0,
    rescue_capabilities TEXT,
    clinic_name VARCHAR(255),
    clinic_address TEXT,
    license_number VARCHAR(100),
    specializations TEXT,
    emergency_24_7 BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    is_test_account BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_status);

-- 2. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(100) NOT NULL CHECK (organization_type IN ('Rescuer', 'Veterinary Clinic', 'NGO & Shelter', 'Transport Partner')),
    address TEXT NOT NULL,
    service_area VARCHAR(255) NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    contact_phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(organization_type);

-- 3. RESCUE REPORTS TABLE
CREATE TABLE IF NOT EXISTS rescue_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(50) UNIQUE NOT NULL,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    animal_type VARCHAR(50) NOT NULL CHECK (animal_type IN ('Dog', 'Cat', 'Cow', 'Bird', 'Other')),
    condition TEXT NOT NULL,
    description TEXT,
    photo_storage_path TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    landmark TEXT,
    urgency VARCHAR(50) NOT NULL CHECK (urgency IN ('Critical', 'High', 'Moderate')),
    status VARCHAR(50) NOT NULL DEFAULT 'Reported' CHECK (status IN ('Reported', 'Assigned', 'On the Way', 'Rescued', 'Treated', 'Closed')),
    verified BOOLEAN DEFAULT FALSE,
    reporter_name VARCHAR(255),
    reporter_phone VARCHAR(50),
    is_anonymous BOOLEAN DEFAULT FALSE,
    assigned_clinic_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    assigned_clinic_name VARCHAR(255),
    handoff_status VARCHAR(50) DEFAULT NULL CHECK (handoff_status IN ('pending', 'accepted', 'completed')),
    is_test_case BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_case_id ON rescue_reports(case_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON rescue_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_urgency ON rescue_reports(urgency);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON rescue_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON rescue_reports(created_at DESC);

-- 4. RESCUE ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS rescue_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rescue_report_id UUID NOT NULL REFERENCES rescue_reports(id) ON DELETE CASCADE,
    rescuer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_status VARCHAR(50) NOT NULL DEFAULT 'assigned' CHECK (assignment_status IN ('assigned', 'accepted', 'declined', 'rejected', 'completed')),
    rejection_reason TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_active_assignment UNIQUE (rescue_report_id, rescuer_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_report ON rescue_assignments(rescue_report_id);
CREATE INDEX IF NOT EXISTS idx_assignments_rescuer ON rescue_assignments(rescuer_id);

-- 5. RESCUE STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS rescue_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rescue_report_id UUID NOT NULL REFERENCES rescue_reports(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_status_history_report ON rescue_status_history(rescue_report_id);

-- 6. VETERINARY RECORDS TABLE
CREATE TABLE IF NOT EXISTS veterinary_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rescue_report_id UUID UNIQUE NOT NULL REFERENCES rescue_reports(id) ON DELETE CASCADE,
    veterinarian_id UUID REFERENCES users(id) ON DELETE SET NULL,
    veterinarian_name VARCHAR(255) NOT NULL,
    diagnosis TEXT NOT NULL,
    treatment TEXT NOT NULL,
    recovery_status VARCHAR(100) NOT NULL DEFAULT 'Under Observation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vet_records_report ON veterinary_records(rescue_report_id);

-- 7. RESPONDER AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS responder_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rescuer_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    availability_status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'unavailable', 'busy')),
    service_area VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_availability_rescuer ON responder_availability(rescuer_id);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rescue_report_id UUID REFERENCES rescue_reports(id) ON DELETE SET NULL,
    case_id VARCHAR(50),
    title VARCHAR(255),
    notification_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);

-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE veterinary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE responder_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read of verified organizations and basic case tracking lookups
CREATE POLICY "Public can view verified organizations" ON organizations
    FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Public can view basic case tracking" ON rescue_reports
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports" ON rescue_reports
    FOR INSERT WITH CHECK (true);
