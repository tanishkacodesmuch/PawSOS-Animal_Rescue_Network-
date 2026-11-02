export type UserRole = 'citizen' | 'rescuer' | 'vet' | 'ngo' | 'admin';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type RescueStage = 'Reported' | 'Assigned' | 'On the Way' | 'Rescued' | 'Treated' | 'Closed';

export type UrgencyLevel = 'Critical' | 'High' | 'Moderate';

export type AnimalType = 'Dog' | 'Cat' | 'Cow' | 'Bird' | 'Other';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  city: string;
  organizationName?: string;
  experienceYears?: number;
  rescueCapabilities?: string[];
  clinicName?: string;
  clinicAddress?: string;
  licenseNumber?: string;
  specializations?: string[];
  emergency247?: boolean;
  rejectionReason?: string;
  isTestAccount?: boolean;
  createdAt: string;
}

export interface PartnerApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  city: string;
  verificationStatus: VerificationStatus;
  organizationName?: string;
  experienceYears?: number;
  rescueCapabilities?: string[];
  clinicName?: string;
  clinicAddress?: string;
  licenseNumber?: string;
  specializations?: string[];
  emergency247?: boolean;
  rejectionReason?: string;
  isTestAccount?: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  rescueReportId?: string;
  caseId?: string;
  title: string;
  notificationType: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
}

export interface CaseTimelineEvent {
  id: string;
  stage: RescueStage;
  timestamp: string;
  title: string;
  description: string;
  actor: string;
}

export interface RescueCase {
  id: string; // Database UUID
  caseId: string; // Public identifier e.g. "AER-8492"
  reporterId?: string;
  animalType: AnimalType;
  condition: string;
  description: string;
  urgency: UrgencyLevel;
  status: RescueStage;
  photoUrl: string; // Supabase public URL or base64 data
  lat: number;
  lng: number;
  address: string;
  landmark: string;
  reportedAt: string;
  updatedAt: string;
  verified: boolean;
  reporter?: {
    name: string;
    phone: string;
    anonymous: boolean;
  };
  assignedRescuer?: {
    id: string;
    name: string;
    phone?: string;
    city?: string;
    assignmentStatus: 'assigned' | 'pending' | 'accepted' | 'declined' | 'rejected';
    assignedAt: string;
    etaMinutes?: number;
    rejectionReason?: string;
  };
  assignedClinicId?: string;
  assignedClinicName?: string;
  handoffStatus?: 'pending' | 'accepted' | 'completed';
  isTestCase?: boolean;
  veterinaryRecord?: {
    id: string;
    veterinarianId: string;
    veterinarianName: string;
    diagnosis: string;
    treatment: string;
    recoveryStatus: string;
    updatedAt: string;
  };
  timeline: CaseTimelineEvent[];
}

export interface RescuerAvailability {
  rescuerId: string;
  name: string;
  phone?: string;
  maskedPhone?: string;
  availabilityStatus: 'available' | 'unavailable' | 'busy' | 'pending_verification';
  serviceArea: string;
  experienceYears?: number;
  capabilities?: string[];
  isVerified?: boolean;
  updatedAt: string;
}

export interface OrganizationProfile {
  id: string;
  organizationName: string;
  organizationType: 'Rescuer' | 'Veterinary Clinic' | 'NGO & Shelter' | 'Transport Partner';
  address: string;
  serviceArea: string;
  verificationStatus: VerificationStatus;
  contactPhone?: string;
  email?: string;
}

export interface AnalyticsOverview {
  totalReports: number;
  pendingReports: number;
  activeRescues: number;
  completedCases: number;
  averageResponseTimeMinutes: number | null;
  caseClosureRate: number | null;
  registeredRescuers: number;
  verifiedRescuers: number;
  partnerClinics: number;
  speciesDistribution: { name: string; count: number }[];
  urgencyDistribution: { name: string; count: number }[];
  monthlyTrends: { month: string; rescues: number }[];
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}
