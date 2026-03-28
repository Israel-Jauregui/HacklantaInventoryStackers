import { createContext, useContext, useState } from 'react';
import {
  ADMIN_DEMO_CREDENTIALS,
  ADMIN_PORTAL_REPORTS,
  type AdminPriority,
  type AdminReport,
  type AdminWorkflowStatus,
} from '@/data/adminPortalMock';

interface AdminOfficial {
  name: string;
  title: string;
  email: string;
}

interface AdminPortalContextValue {
  isAuthenticated: boolean;
  official: AdminOfficial | null;
  reports: AdminReport[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateStatus: (id: string, status: AdminWorkflowStatus) => void;
  assignPriority: (id: string, priority: AdminPriority) => void;
  addInternalNote: (id: string, message: string) => void;
}

const AdminPortalContext = createContext<AdminPortalContextValue>({
  isAuthenticated: false,
  official: null,
  reports: [],
  login: () => false,
  logout: () => {},
  updateStatus: () => {},
  assignPriority: () => {},
  addInternalNote: () => {},
});

export function useAdminPortal() {
  return useContext(AdminPortalContext);
}

export function AdminPortalProvider({ children }: { children: React.ReactNode }) {
  const [official, setOfficial] = useState<AdminOfficial | null>(null);
  const [reports, setReports] = useState<AdminReport[]>(ADMIN_PORTAL_REPORTS);

  const login = (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (
      normalizedEmail === ADMIN_DEMO_CREDENTIALS.email &&
      normalizedPassword === ADMIN_DEMO_CREDENTIALS.password
    ) {
      setOfficial({
        name: 'Jordan Ellis',
        title: 'City Operations Coordinator',
        email: ADMIN_DEMO_CREDENTIALS.email,
      });
      return true;
    }

    return false;
  };

  const logout = () => {
    setOfficial(null);
  };

  const updateStatus = (id: string, status: AdminWorkflowStatus) => {
    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === id
          ? {
              ...report,
              status,
              updatedAt: new Date().toISOString(),
            }
          : report
      )
    );
  };

  const assignPriority = (id: string, priority: AdminPriority) => {
    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === id
          ? {
              ...report,
              priority,
              updatedAt: new Date().toISOString(),
            }
          : report
      )
    );
  };

  const addInternalNote = (id: string, message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === id
          ? {
              ...report,
              notes: [
                {
                  id: `${report.id}-${Date.now()}`,
                  author: official?.name ?? 'Admin Official',
                  message: trimmedMessage,
                  createdAt: new Date().toISOString(),
                },
                ...report.notes,
              ],
              updatedAt: new Date().toISOString(),
            }
          : report
      )
    );
  };

  const value = {
    isAuthenticated: Boolean(official),
    official,
    reports,
    login,
    logout,
    updateStatus,
    assignPriority,
    addInternalNote,
  };

  return <AdminPortalContext.Provider value={value}>{children}</AdminPortalContext.Provider>;
}
