import {
  AuthResponse,
  UserProfile,
  PartnerApplication,
  AppNotification,
  RescueCase,
  AnalyticsOverview,
  RescuerAvailability,
  OrganizationProfile,
  RescueStage,
} from '../types/rescue';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('pawsos_auth_token') : null;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('pawsos_auth_token', token);
      } else {
        localStorage.removeItem('pawsos_auth_token');
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMessage = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // Fallback to text status
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // --- Auth Endpoints ---

  public async register(userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: string;
    city: string;
    organizationName?: string;
    experienceYears?: number;
    rescueCapabilities?: string[];
    clinicName?: string;
    clinicAddress?: string;
    licenseNumber?: string;
    specializations?: string[];
    emergency247?: boolean;
    isTestAccount?: boolean;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(res.token);
    return res;
  }

  public async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(res.token);
    return res;
  }

  public async getCurrentUser(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }

  public logout() {
    this.setToken(null);
  }

  // --- In-App Notifications ---

  public async getNotifications(): Promise<AppNotification[]> {
    return this.request<AppNotification[]>('/notifications');
  }

  public async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  // --- Rescue Reports ---

  public async createReport(data: {
    animalType: string;
    condition: string;
    description: string;
    photoUrl: string;
    lat: number;
    lng: number;
    landmark?: string;
    address?: string;
    urgency: string;
    reporterName?: string;
    reporterPhone?: string;
    isAnonymous?: boolean;
    isTestCase?: boolean;
  }): Promise<RescueCase> {
    return this.request<RescueCase>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getReports(params?: {
    status?: string;
    urgency?: string;
    animalType?: string;
    city?: string;
  }): Promise<RescueCase[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.urgency && params.urgency !== 'all') query.set('urgency', params.urgency);
    if (params?.animalType && params.animalType !== 'all') query.set('animal_type', params.animalType);
    if (params?.city) query.set('city', params.city);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<RescueCase[]>(`/reports${queryString}`);
  }

  public async getMyReports(): Promise<RescueCase[]> {
    return this.request<RescueCase[]>('/reports/my');
  }

  public async getReportByCaseId(caseId: string): Promise<RescueCase> {
    return this.request<RescueCase>(`/reports/${encodeURIComponent(caseId.toUpperCase())}`);
  }

  public async updateReportStatus(
    caseId: string,
    status: RescueStage,
    notes?: string
  ): Promise<RescueCase> {
    return this.request<RescueCase>(`/reports/${encodeURIComponent(caseId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  // --- Admin Operations ---

  public async verifyReport(caseId: string): Promise<RescueCase> {
    return this.request<RescueCase>(`/admin/reports/${encodeURIComponent(caseId)}/verify`, {
      method: 'POST',
    });
  }

  public async getPartnerApplications(statusFilter?: string, roleFilter?: string): Promise<PartnerApplication[]> {
    const query = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') query.set('status', statusFilter);
    if (roleFilter && roleFilter !== 'all') query.set('role', roleFilter);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<PartnerApplication[]>(`/admin/applications${qs}`);
  }

  public async approvePartnerApplication(userId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/applications/${userId}/approve`, {
      method: 'POST',
    });
  }

  public async rejectPartnerApplication(userId: string, reason: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/applications/${userId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  public async requestPartnerInfo(userId: string, message: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/applications/${userId}/request-info`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // --- Rescuer Assignments & Duty ---

  public async getAvailableRescuers(serviceArea?: string): Promise<RescuerAvailability[]> {
    const query = serviceArea ? `?service_area=${encodeURIComponent(serviceArea)}` : '';
    return this.request<RescuerAvailability[]>(`/rescuers/available${query}`);
  }

  public async assignRescuer(reportId: string, rescuerId: string): Promise<{ success: boolean; assignmentId: string }> {
    return this.request<{ success: boolean; assignmentId: string }>('/assignments', {
      method: 'POST',
      body: JSON.stringify({ rescueReportId: reportId, rescuerId }),
    });
  }

  public async acceptAssignment(assignmentId: string): Promise<{ success: boolean; caseId: string }> {
    return this.request<{ success: boolean; caseId: string }>(`/assignments/${assignmentId}/accept`, {
      method: 'POST',
    });
  }

  public async rejectAssignment(assignmentId: string, reason: string): Promise<{ success: boolean; caseId: string }> {
    return this.request<{ success: boolean; caseId: string }>(`/assignments/${assignmentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  public async updateAvailability(
    status: 'available' | 'unavailable' | 'busy',
    serviceArea: string
  ): Promise<RescuerAvailability> {
    return this.request<RescuerAvailability>('/rescuers/availability', {
      method: 'POST',
      body: JSON.stringify({ availabilityStatus: status, serviceArea }),
    });
  }

  // --- Veterinary Operations ---

  public async initiateVeterinaryHandoff(
    caseId: string,
    clinicId: string,
    notes?: string
  ): Promise<{ success: boolean; caseId: string; clinicName: string }> {
    return this.request<{ success: boolean; caseId: string; clinicName: string }>(
      `/reports/${encodeURIComponent(caseId)}/handoff`,
      {
        method: 'POST',
        body: JSON.stringify({ clinicId, notes }),
      }
    );
  }

  public async getVeterinaryCases(): Promise<RescueCase[]> {
    return this.request<RescueCase[]>('/veterinary/cases');
  }

  public async acceptVeterinaryHandoff(caseId: string): Promise<{ success: boolean; caseId: string; status: string }> {
    return this.request<{ success: boolean; caseId: string; status: string }>(
      `/veterinary/cases/${encodeURIComponent(caseId)}/accept-handoff`,
      {
        method: 'POST',
      }
    );
  }

  public async createVeterinaryRecord(data: {
    rescueReportId: string;
    diagnosis: string;
    treatment: string;
    recoveryStatus: string;
  }): Promise<{ id: string; success: boolean; caseId: string }> {
    return this.request<{ id: string; success: boolean; caseId: string }>('/veterinary/records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Organizations & Analytics ---

  public async getOrganizations(): Promise<OrganizationProfile[]> {
    return this.request<OrganizationProfile[]>('/organizations');
  }

  public async getAnalytics(): Promise<AnalyticsOverview> {
    return this.request<AnalyticsOverview>('/analytics/overview');
  }

  // --- Safe Test Mode ---

  public async getTestStatus(): Promise<{
    testModeAvailable: boolean;
    testAccountsLoaded: boolean;
    testAccountsCount: number;
    testCasesCount: number;
  }> {
    return this.request('/test/status');
  }

  public async seedTestAccounts(): Promise<{
    success: boolean;
    message: string;
    accounts: any[];
    password: string;
  }> {
    return this.request('/test/seed-accounts', {
      method: 'POST',
    });
  }

  public async resetTestData(): Promise<{ success: boolean; message: string }> {
    return this.request('/test/reset', {
      method: 'POST',
    });
  }

  // --- Photo Upload ---

  public async uploadPhoto(file: File): Promise<{ url: string; path: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE_URL}/storage/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Photo upload failed. Please check file format and size.');
    }

    return res.json();
  }
}

export const api = new ApiClient();
