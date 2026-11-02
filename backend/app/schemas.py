from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
import uuid

# User Schemas
class UserRegister(BaseModel):
    fullName: str
    email: EmailStr
    phone: str
    password: str = Field(min_length=8)
    role: str = "citizen"
    city: str
    organizationName: Optional[str] = None
    experienceYears: Optional[int] = 0
    rescueCapabilities: Optional[List[str]] = []
    clinicName: Optional[str] = None
    clinicAddress: Optional[str] = None
    licenseNumber: Optional[str] = None
    specializations: Optional[List[str]] = []
    emergency247: Optional[bool] = False
    isTestAccount: Optional[bool] = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileOut(BaseModel):
    id: uuid.UUID
    fullName: str
    email: str
    phone: str
    role: str
    verificationStatus: str
    city: str
    organizationName: Optional[str] = None
    experienceYears: Optional[int] = 0
    rescueCapabilities: Optional[List[str]] = []
    clinicName: Optional[str] = None
    clinicAddress: Optional[str] = None
    licenseNumber: Optional[str] = None
    specializations: Optional[List[str]] = []
    emergency247: Optional[bool] = False
    isTestAccount: Optional[bool] = False
    createdAt: datetime

class AuthResponse(BaseModel):
    token: str
    user: UserProfileOut

# Partner Application Schemas for Admin Dashboard
class PartnerApplicationOut(BaseModel):
    id: uuid.UUID
    fullName: str
    email: str
    phone: str
    role: str
    city: str
    organizationName: Optional[str] = None
    verificationStatus: str
    experienceYears: Optional[int] = 0
    rescueCapabilities: Optional[List[str]] = []
    clinicName: Optional[str] = None
    clinicAddress: Optional[str] = None
    licenseNumber: Optional[str] = None
    specializations: Optional[List[str]] = []
    emergency247: Optional[bool] = False
    rejectionReason: Optional[str] = None
    isTestAccount: Optional[bool] = False
    createdAt: datetime

class PartnerReviewAction(BaseModel):
    reason: Optional[str] = None
    message: Optional[str] = None

# Report Schemas
class ReportCreate(BaseModel):
    animalType: str
    condition: str
    description: Optional[str] = ""
    photoUrl: str
    lat: float
    lng: float
    address: str
    landmark: Optional[str] = ""
    urgency: str
    reporterName: Optional[str] = "Anonymous Citizen"
    reporterPhone: Optional[str] = "Not provided"
    isAnonymous: Optional[bool] = False
    isTestCase: Optional[bool] = False

class StatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class TimelineEventOut(BaseModel):
    id: uuid.UUID
    stage: str
    timestamp: datetime
    title: str
    description: Optional[str] = None
    actor: str

class RescuerInfoOut(BaseModel):
    id: uuid.UUID
    name: str
    phone: Optional[str] = None
    city: Optional[str] = None
    assignmentStatus: str
    assignedAt: datetime
    etaMinutes: Optional[int] = None
    rejectionReason: Optional[str] = None

class VeterinaryRecordOut(BaseModel):
    id: uuid.UUID
    veterinarianId: Optional[uuid.UUID] = None
    veterinarianName: str
    diagnosis: str
    treatment: str
    recoveryStatus: str
    updatedAt: datetime

class RescueCaseOut(BaseModel):
    id: uuid.UUID
    caseId: str
    reporterId: Optional[uuid.UUID] = None
    animalType: str
    condition: str
    description: Optional[str] = None
    photoUrl: str
    lat: float
    lng: float
    address: str
    landmark: Optional[str] = None
    urgency: str
    status: str
    verified: bool
    reportedAt: datetime
    updatedAt: datetime
    reporter: dict
    assignedRescuer: Optional[RescuerInfoOut] = None
    assignedClinicId: Optional[uuid.UUID] = None
    assignedClinicName: Optional[str] = None
    handoffStatus: Optional[str] = None
    isTestCase: Optional[bool] = False
    veterinaryRecord: Optional[VeterinaryRecordOut] = None
    timeline: List[TimelineEventOut] = []

# Assignment Schemas
class AssignmentCreate(BaseModel):
    rescueReportId: str
    rescuerId: str

class AssignmentReject(BaseModel):
    reason: str

class RescuerAvailabilityOut(BaseModel):
    rescuerId: uuid.UUID
    name: str
    maskedPhone: str
    availabilityStatus: str
    serviceArea: str
    experienceYears: Optional[int] = 0
    capabilities: Optional[List[str]] = []
    isVerified: bool = True
    updatedAt: datetime

class AvailabilityUpdate(BaseModel):
    availabilityStatus: str
    serviceArea: Optional[str] = None

# Veterinary Schemas
class VeterinaryRecordCreate(BaseModel):
    rescueReportId: str
    diagnosis: str
    treatment: str
    recoveryStatus: Optional[str] = "Under Observation"

class VeterinaryHandoffCreate(BaseModel):
    clinicId: str
    notes: Optional[str] = None

# Notification Schemas
class NotificationOut(BaseModel):
    id: uuid.UUID
    recipientId: uuid.UUID
    rescueReportId: Optional[uuid.UUID] = None
    caseId: Optional[str] = None
    title: Optional[str] = None
    notificationType: str
    message: str
    readStatus: bool
    createdAt: datetime

# Organization Schemas
class OrganizationOut(BaseModel):
    id: uuid.UUID
    organizationName: str
    organizationType: str
    address: str
    serviceArea: str
    verificationStatus: str
    contactPhone: Optional[str] = None
    email: Optional[str] = None

# Analytics Overview
class AnalyticsOut(BaseModel):
    totalReports: int = 0
    pendingReports: int = 0
    activeRescues: int = 0
    completedCases: int = 0
    averageResponseTimeMinutes: Optional[int] = None
    caseClosureRate: Optional[int] = None
    registeredRescuers: int = 0
    verifiedRescuers: int = 0
    partnerClinics: int = 0
    speciesDistribution: List[dict] = []
    urgencyDistribution: List[dict] = []
    monthlyTrends: List[dict] = []
