import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    Float,
    DateTime,
    Integer,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="citizen") # citizen, rescuer, vet, ngo, admin
    verification_status = Column(String(50), nullable=False, default="pending") # pending, verified, rejected
    city = Column(String(100), nullable=False)
    organization_name = Column(String(255), nullable=True)
    experience_years = Column(Integer, default=0)
    rescue_capabilities = Column(Text, nullable=True) # JSON or comma-separated list
    clinic_name = Column(String(255), nullable=True)
    clinic_address = Column(Text, nullable=True)
    license_number = Column(String(100), nullable=True)
    specializations = Column(Text, nullable=True)
    emergency_24_7 = Column(Boolean, default=False)
    rejection_reason = Column(Text, nullable=True)
    reviewed_by = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    is_test_account = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reports = relationship("RescueReport", back_populates="reporter", foreign_keys="RescueReport.reporter_id")
    assignments = relationship("RescueAssignment", back_populates="rescuer")
    availability = relationship("ResponderAvailability", back_populates="rescuer", uselist=False)

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_name = Column(String(255), nullable=False)
    organization_type = Column(String(100), nullable=False) # Rescuer, Veterinary Clinic, NGO & Shelter, Transport Partner
    address = Column(Text, nullable=False)
    service_area = Column(String(255), nullable=False)
    verification_status = Column(String(50), nullable=False, default="pending")
    contact_phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class RescueReport(Base):
    __tablename__ = "rescue_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(String(50), unique=True, nullable=False, index=True)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    animal_type = Column(String(50), nullable=False) # Dog, Cat, Cow, Bird, Other
    condition = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    photo_storage_path = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(Text, nullable=False)
    landmark = Column(Text, nullable=True)
    urgency = Column(String(50), nullable=False) # Critical, High, Moderate
    status = Column(String(50), nullable=False, default="Reported") # Reported, Assigned, On the Way, Rescued, Treated, Closed
    verified = Column(Boolean, default=False)
    reporter_name = Column(String(255), nullable=True)
    reporter_phone = Column(String(50), nullable=True)
    is_anonymous = Column(Boolean, default=False)
    assigned_clinic_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    assigned_clinic_name = Column(String(255), nullable=True)
    handoff_status = Column(String(50), nullable=True) # pending, accepted, completed
    is_test_case = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])
    assignments = relationship("RescueAssignment", back_populates="report", cascade="all, delete-orphan")
    status_history = relationship("RescueStatusHistory", back_populates="report", cascade="all, delete-orphan")
    veterinary_record = relationship("VeterinaryRecord", back_populates="report", uselist=False, cascade="all, delete-orphan")

class RescueAssignment(Base):
    __tablename__ = "rescue_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rescue_report_id = Column(UUID(as_uuid=True), ForeignKey("rescue_reports.id", ondelete="CASCADE"), nullable=False)
    rescuer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assignment_status = Column(String(50), nullable=False, default="assigned") # assigned, accepted, declined, rejected, completed
    rejection_reason = Column(Text, nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint('rescue_report_id', 'rescuer_id', name='uq_report_rescuer_assignment'),
    )

    # Relationships
    report = relationship("RescueReport", back_populates="assignments")
    rescuer = relationship("User", back_populates="assignments")

class RescueStatusHistory(Base):
    __tablename__ = "rescue_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rescue_report_id = Column(UUID(as_uuid=True), ForeignKey("rescue_reports.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)
    updated_by = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("RescueReport", back_populates="status_history")

class VeterinaryRecord(Base):
    __tablename__ = "veterinary_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rescue_report_id = Column(UUID(as_uuid=True), ForeignKey("rescue_reports.id", ondelete="CASCADE"), unique=True, nullable=False)
    veterinarian_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    veterinarian_name = Column(String(255), nullable=False)
    diagnosis = Column(Text, nullable=False)
    treatment = Column(Text, nullable=False)
    recovery_status = Column(String(100), nullable=False, default="Under Observation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    report = relationship("RescueReport", back_populates="veterinary_record")

class ResponderAvailability(Base):
    __tablename__ = "responder_availability"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rescuer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    availability_status = Column(String(50), nullable=False, default="available") # available, unavailable, busy
    service_area = Column(String(255), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    rescuer = relationship("User", back_populates="availability")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rescue_report_id = Column(UUID(as_uuid=True), ForeignKey("rescue_reports.id", ondelete="SET NULL"), nullable=True)
    case_id = Column(String(50), nullable=True)
    title = Column(String(255), nullable=True)
    notification_type = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    read_status = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
