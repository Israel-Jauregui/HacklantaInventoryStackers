import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/context/AppContext';
import {
  adminAddNote,
  adminListReports,
  adminLogin,
  adminPublishPublicUpdate,
  adminUpdateAssignment,
  adminUpdatePriority,
  adminUpdateStatus,
  type AdminApiReport,
  type AdminApiUser,
} from '@/lib/api';
import type {
  AdminPriority,
  AdminReport,
  AdminWorkflowStatus,
} from '@/data/adminPortalMock';

interface AdminUser {
  name: string;
  title: string;
  email: string;
  role: 'official';
  team: string | null;
}

interface LoginResult {
  success: boolean;
  message?: string;
}

interface AdminPortalContextValue {
  isReady: boolean;
  isAuthenticated: boolean;
  user: AdminUser | null;
  canAssignPriority: boolean;
  reports: AdminReport[];
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  refreshReports: () => Promise<void>;
  updateStatus: (id: string, status: AdminWorkflowStatus) => Promise<void>;
  assignPriority: (id: string, priority: AdminPriority) => Promise<void>;
  assignTeam: (id: string, team: string) => Promise<void>;
  addInternalNote: (id: string, message: string) => Promise<void>;
  publishPublicUpdate: (id: string, message: string) => Promise<void>;
}

const AdminPortalContext = createContext<AdminPortalContextValue>({
  isReady: false,
  isAuthenticated: false,
  user: null,
  canAssignPriority: false,
  reports: [],
  login: async () => ({ success: false }),
  logout: () => {},
  refreshReports: async () => {},
  updateStatus: async () => {},
  assignPriority: async () => {},
  assignTeam: async () => {},
  addInternalNote: async () => {},
  publishPublicUpdate: async () => {},
});

export function useAdminPortal() {
  return useContext(AdminPortalContext);
}

const ADMIN_SESSION_KEY = 'admin_portal_session';

function mapApiAdminReport(apiReport: AdminApiReport): AdminReport {
  return {
    ...apiReport,
    imageUri: apiReport.imageUri?.startsWith('http')
      ? apiReport.imageUri
      : apiReport.imageUri
      ? `${apiReport.imageUri}`
      : '',
  };
}

function mapApiAdminUser(apiUser: AdminApiUser): AdminUser {
  return {
    name: apiUser.name,
    title: apiUser.title,
    email: apiUser.email,
    role: apiUser.role,
    team: apiUser.team,
  };
}

export function AdminPortalProvider({ children }: { children: ReactNode }) {
  const { updatePublicReport, updateReportStatus: updateResidentStatus } = useApp();
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);

  const refreshReports = async () => {
    try {
      const apiReports = await adminListReports();
      setReports(apiReports.map(mapApiAdminReport));
    } catch (error) {
      console.warn('Failed to load admin reports from API', error);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const storedUser = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser) as AdminUser);
        }
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    void refreshReports();
  }, [user]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      return { success: false, message: 'Email and password are required.' };
    }

    try {
      const adminUser = await adminLogin(normalizedEmail, normalizedPassword);
      const nextUser = mapApiAdminUser(adminUser);
      setUser(nextUser);
      await AsyncStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(nextUser));
      await refreshReports();
      return { success: true };
    } catch {
      return {
        success: false,
        message: 'Invalid credentials or admin portal service unavailable.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setReports([]);
    void AsyncStorage.removeItem(ADMIN_SESSION_KEY);
  };

  const updateStatus = async (id: string, status: AdminWorkflowStatus) => {
    try {
      const updated = await adminUpdateStatus(id, status);
      const mapped = mapApiAdminReport(updated);
      setReports((currentReports) =>
        currentReports.map((report) => (report.id === id ? mapped : report))
      );
      updateResidentStatus(id, status === 'resolved' ? 'fixed' : 'open');
    } catch (error) {
      console.warn('Failed to update admin status', error);
    }
  };

  const assignPriority = async (id: string, priority: AdminPriority) => {
    if (!user) return;

    try {
      const updated = await adminUpdatePriority(id, priority);
      const mapped = mapApiAdminReport(updated);
      setReports((currentReports) =>
        currentReports.map((report) => (report.id === id ? mapped : report))
      );
    } catch (error) {
      console.warn('Failed to update report priority', error);
    }
  };

  const assignTeam = async (id: string, team: string) => {
    if (!user) return;

    const trimmedTeam = team.trim();
    if (!trimmedTeam) return;

    try {
      const updated = await adminUpdateAssignment(id, trimmedTeam, user.name);
      const mapped = mapApiAdminReport(updated);
      setReports((currentReports) =>
        currentReports.map((report) => (report.id === id ? mapped : report))
      );
    } catch (error) {
      console.warn('Failed to assign team', error);
    }
  };

  const addInternalNote = async (id: string, message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    try {
      const updated = await adminAddNote(id, user?.name ?? 'City Official', trimmedMessage);
      const mapped = mapApiAdminReport(updated);
      setReports((currentReports) =>
        currentReports.map((report) => (report.id === id ? mapped : report))
      );
    } catch (error) {
      console.warn('Failed to add internal note', error);
    }
  };

  const publishPublicUpdate = async (id: string, message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !user) return;

    try {
      const updated = await adminPublishPublicUpdate(id, user.name, trimmedMessage);
      const mapped = mapApiAdminReport(updated);
      setReports((currentReports) =>
        currentReports.map((report) => (report.id === id ? mapped : report))
      );

      if (mapped.publicUpdate) {
        updatePublicReport(id, {
          publicUpdate: mapped.publicUpdate,
        });
      }
    } catch (error) {
      console.warn('Failed to publish public update', error);
    }
  };

  const value = {
    isReady,
    isAuthenticated: Boolean(user),
    user,
    canAssignPriority: Boolean(user),
    reports,
    login,
    logout,
    refreshReports,
    updateStatus,
    assignPriority,
    assignTeam,
    addInternalNote,
    publishPublicUpdate,
  };

  return <AdminPortalContext.Provider value={value}>{children}</AdminPortalContext.Provider>;
}
