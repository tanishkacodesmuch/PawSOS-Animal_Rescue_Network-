import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  RescueCase,
  RescueStage,
  UserProfile,
  UserRole,
  CaseTimelineEvent,
  AnalyticsOverview,
  AppNotification,
} from '../types/rescue';
import { api } from '../services/api';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'emergency';
  title: string;
  description: string;
}

interface RescueContextType {
  // Authentication
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
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
  }) => Promise<void>;
  logout: () => void;

  // Real Rescue Cases
  cases: RescueCase[];
  myCases: RescueCase[];
  isLoadingCases: boolean;
  refreshCases: () => Promise<void>;
  createReport: (data: {
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
  }) => Promise<RescueCase>;
  updateCaseStatus: (caseId: string, stage: RescueStage, notes?: string) => Promise<void>;
  verifyCase: (caseId: string) => Promise<void>;
  assignRescuer: (reportId: string, rescuerId: string) => Promise<void>;
  acceptCase: (assignmentId: string) => Promise<void>;
  rejectCase: (assignmentId: string, reason: string) => Promise<void>;
  initiateHandoff: (caseId: string, clinicId: string, notes?: string) => Promise<void>;
  acceptHandoff: (caseId: string) => Promise<void>;
  updateVetTreatment: (
    reportId: string,
    data: { diagnosis: string; treatment: string; recoveryStatus: string }
  ) => Promise<void>;
  getCaseById: (caseId: string) => Promise<RescueCase | undefined>;

  // In-App Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;

  // Analytics
  analytics: AnalyticsOverview | null;
  refreshAnalytics: () => Promise<void>;

  // Safe Test Mode
  testMode: boolean;
  setTestMode: (enabled: boolean) => void;
  seedTestAccounts: () => Promise<{ success: boolean; message: string; accounts: any[]; password: string }>;
  resetTestData: () => Promise<void>;

  // UI & Navigation
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  currentRoute: string;
  navigateTo: (route: string) => void;
}

const RescueContext = createContext<RescueContextType | undefined>(undefined);

export const RescueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [cases, setCases] = useState<RescueCase[]>([]);
  const [myCases, setMyCases] = useState<RescueCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [testMode, setTestModeState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pawsos_test_mode') === 'true';
    }
    return false;
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return path && path !== '/' ? path : '/';
    }
    return '/';
  });

  const setTestMode = (enabled: boolean) => {
    setTestModeState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pawsos_test_mode', enabled ? 'true' : 'false');
    }
    addToast({
      type: enabled ? 'warning' : 'info',
      title: enabled ? '⚠️ Test Mode Activated' : 'Test Mode Disabled',
      description: enabled
        ? 'Using isolated test mode environment. Sample test accounts can now be seeded.'
        : 'Returned to live standard operations.',
    });
  };

  // Toast Helper
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      dismissToast(id);
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', route);
    }
  };

  // Listen to browser navigation popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check auth session on boot
  useEffect(() => {
    const checkSession = async () => {
      const token = api.getToken();
      if (!token) {
        setIsAuthLoading(false);
        return;
      }
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Session verification failed, logging out:', err);
        api.logout();
        setCurrentUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  // Notifications loader
  const refreshNotifications = async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // Ignore background notification fetch errors
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readStatus: true } : n)));
    } catch {
      // Ignore error
    }
  };

  // Refresh cases
  const refreshCases = async () => {
    setIsLoadingCases(true);
    try {
      const allCases = await api.getReports();
      setCases(allCases);

      if (currentUser) {
        const my = await api.getMyReports();
        setMyCases(my);
      } else {
        setMyCases([]);
      }
    } catch (err) {
      console.error('Error fetching reports from database:', err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  // Refresh analytics
  const refreshAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch {
      // Ignore error
    }
  };

  // Initial data load and notifications polling
  useEffect(() => {
    refreshCases();
    refreshAnalytics();
    refreshNotifications();

    const interval = setInterval(() => {
      if (currentUser) {
        refreshNotifications();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Auth: Login
  const login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.login(credentials);
      setCurrentUser(response.user);
      addToast({
        type: 'success',
        title: `Welcome, ${response.user.fullName}!`,
        description: `Signed in as ${response.user.role.toUpperCase()}.${
          response.user.verificationStatus === 'pending'
            ? ' (Note: Profile accreditation is pending administrator verification)'
            : ''
        }`,
      });
      await refreshCases();
      await refreshNotifications();

      // Route based on role
      if (response.user.role === 'admin') navigateTo('/admin/dashboard');
      else if (response.user.role === 'rescuer') navigateTo('/responder/dashboard');
      else if (response.user.role === 'vet') navigateTo('/vet/dashboard');
      else if (response.user.role === 'ngo') navigateTo('/shelter/dashboard');
      else navigateTo('/citizen/dashboard');
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Authentication Failed',
        description: err.message || 'Invalid email or password.',
      });
      throw err;
    }
  };

  // Auth: Register
  const register = async (userData: {
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
  }) => {
    try {
      const response = await api.register(userData);
      setCurrentUser(response.user);
      addToast({
        type: 'success',
        title: 'Account Created',
        description:
          response.user.role === 'citizen'
            ? 'Registration successful. Ready to report emergencies.'
            : 'Application submitted! Privileged access will be granted once reviewed by an administrator.',
      });
      await refreshCases();
      await refreshNotifications();

      if (response.user.role === 'admin') navigateTo('/admin/dashboard');
      else if (response.user.role === 'rescuer') navigateTo('/responder/dashboard');
      else if (response.user.role === 'vet') navigateTo('/vet/dashboard');
      else if (response.user.role === 'ngo') navigateTo('/shelter/dashboard');
      else navigateTo('/citizen/dashboard');
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Registration Error',
        description: err.message || 'Could not complete registration.',
      });
      throw err;
    }
  };

  // Auth: Logout
  const logout = () => {
    api.logout();
    setCurrentUser(null);
    setMyCases([]);
    setNotifications([]);
    addToast({
      type: 'info',
      title: 'Signed Out',
      description: 'You have been securely logged out.',
    });
    navigateTo('/');
  };

  // Create Emergency Report
  const createReport = async (data: {
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
  }): Promise<RescueCase> => {
    try {
      const newCase = await api.createReport({
        ...data,
        isTestCase: data.isTestCase !== undefined ? data.isTestCase : testMode,
      });
      setCases((prev) => [newCase, ...prev]);
      setMyCases((prev) => [newCase, ...prev]);
      addToast({
        type: 'emergency',
        title: `Emergency Case ${newCase.caseId} Created`,
        description: newCase.isTestCase
          ? 'TEST CASE created in isolated test environment.'
          : 'Report saved to database. Dispatched to triage queue.',
      });
      refreshAnalytics();
      return newCase;
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Submission Failed',
        description: err.message || 'Unable to submit emergency report.',
      });
      throw err;
    }
  };

  // Status Progression
  const updateCaseStatus = async (caseId: string, stage: RescueStage, notes?: string) => {
    try {
      const updated = await api.updateReportStatus(caseId, stage, notes);
      setCases((prev) => prev.map((c) => (c.caseId === caseId ? updated : c)));
      setMyCases((prev) => prev.map((c) => (c.caseId === caseId ? updated : c)));
      addToast({
        type: 'success',
        title: `Case ${caseId} Updated`,
        description: `Status advanced to "${stage}".`,
      });
      refreshAnalytics();
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Update Error',
        description: err.message || 'Could not update rescue status.',
      });
      throw err;
    }
  };

  // Verification
  const verifyCase = async (caseId: string) => {
    try {
      const updated = await api.verifyReport(caseId);
      setCases((prev) => prev.map((c) => (c.caseId === caseId ? updated : c)));
      addToast({
        type: 'info',
        title: `Case ${caseId} Verified`,
        description: 'Emergency verified by command dispatcher.',
      });
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Verification Failed',
        description: err.message || 'Could not verify case.',
      });
      throw err;
    }
  };

  // Rescuer Assignment
  const assignRescuer = async (reportId: string, rescuerId: string) => {
    try {
      await api.assignRescuer(reportId, rescuerId);
      addToast({
        type: 'success',
        title: 'Rescuer Assigned',
        description: 'Case assigned to verified responder and notification dispatched.',
      });
      await refreshCases();
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Assignment Failed',
        description: err.message || 'Could not assign responder.',
      });
      throw err;
    }
  };

  // Accept Assignment
  const acceptCase = async (assignmentId: string) => {
    try {
      await api.acceptAssignment(assignmentId);
      addToast({
        type: 'success',
        title: 'Assignment Accepted',
        description: 'Case status updated. Route navigation opened.',
      });
      await refreshCases();
      await refreshNotifications();
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Could Not Accept Assignment',
        description: err.message || 'Failed to accept assignment.',
      });
      throw err;
    }
  };

  // Reject Assignment
  const rejectCase = async (assignmentId: string, reason: string) => {
    try {
      await api.rejectAssignment(assignmentId, reason);
      addToast({
        type: 'info',
        title: 'Assignment Declined',
        description: 'Case returned to central triage queue for reassignment.',
      });
      await refreshCases();
      await refreshNotifications();
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Action Failed',
        description: err.message || 'Could not decline assignment.',
      });
      throw err;
    }
  };

  // Rescuer Handoff to Vet Clinic
  const initiateHandoff = async (caseId: string, clinicId: string, notes?: string) => {
    try {
      const res = await api.initiateVeterinaryHandoff(caseId, clinicId, notes);
      addToast({
        type: 'success',
        title: 'Transfer Initiated',
        description: `Animal en route to ${res.clinicName}. Clinic alerted.`,
      });
      await refreshCases();
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Handoff Error',
        description: err.message || 'Could not initiate veterinary transfer.',
      });
      throw err;
    }
  };

  // Vet Clinic Accepts Handoff
  const acceptHandoff = async (caseId: string) => {
    try {
      await api.acceptVeterinaryHandoff(caseId);
      addToast({
        type: 'success',
        title: 'Patient Admitted',
        description: `Case ${caseId} received into clinic care.`,
      });
      await refreshCases();
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Admit Failed',
        description: err.message || 'Could not accept patient.',
      });
      throw err;
    }
  };

  // Veterinary Treatment Record
  const updateVetTreatment = async (
    reportId: string,
    data: { diagnosis: string; treatment: string; recoveryStatus: string }
  ) => {
    try {
      await api.createVeterinaryRecord({
        rescueReportId: reportId,
        ...data,
      });
      addToast({
        type: 'success',
        title: 'Clinical Chart Saved',
        description: 'Diagnosis and treatment protocol logged in patient record.',
      });
      await refreshCases();
      refreshAnalytics();
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Clinical Record Error',
        description: err.message || 'Could not save treatment record.',
      });
      throw err;
    }
  };

  const getCaseById = async (caseId: string): Promise<RescueCase | undefined> => {
    try {
      return await api.getReportByCaseId(caseId);
    } catch {
      return undefined;
    }
  };

  // Seed Isolated Test Accounts
  const seedTestAccounts = async () => {
    try {
      const res = await api.seedTestAccounts();
      addToast({
        type: 'success',
        title: 'Test Accounts Created',
        description: 'Sample Citizen, Admin, Rescuer, Vet, and Shelter accounts initialized.',
      });
      await refreshCases();
      return res;
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Test Seeding Failed',
        description: err.message || 'Unable to seed test accounts.',
      });
      throw err;
    }
  };

  // Reset Isolated Test Data
  const resetTestData = async () => {
    try {
      await api.resetTestData();
      addToast({
        type: 'info',
        title: 'Test Data Cleared',
        description: 'All isolated test mode records removed.',
      });
      await refreshCases();
      refreshAnalytics();
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Reset Error',
        description: err.message || 'Could not reset test data.',
      });
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.readStatus).length;

  return (
    <RescueContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAuthLoading,
        login,
        register,
        logout,
        cases,
        myCases,
        isLoadingCases,
        refreshCases,
        createReport,
        updateCaseStatus,
        verifyCase,
        assignRescuer,
        acceptCase,
        rejectCase,
        initiateHandoff,
        acceptHandoff,
        updateVetTreatment,
        getCaseById,
        notifications,
        unreadNotificationsCount,
        refreshNotifications,
        markNotificationRead,
        analytics,
        refreshAnalytics,
        testMode,
        setTestMode,
        seedTestAccounts,
        resetTestData,
        toasts,
        dismissToast,
        addToast,
        currentRoute,
        navigateTo,
      }}
    >
      {children}
    </RescueContext.Provider>
  );
};

export const useRescue = (): RescueContextType => {
  const context = useContext(RescueContext);
  if (!context) {
    throw new Error('useRescue must be used within a RescueProvider');
  }
  return context;
};
