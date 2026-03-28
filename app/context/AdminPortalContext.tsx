import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ADMIN_DEMO_CREDENTIALS,
  ADMIN_PORTAL_REPORTS,
  type AdminNote,
  type AdminPriority,
  type AdminReport,
  type AdminRole,
  type AdminWorkflowStatus,
} from '@/data/adminPortalMock';
import { useApp } from '@/context/AppContext';
import { getDistrict, getPriorityFromScore } from '@/utils/adminPortal';

interface AdminUser {
  name: string;
  title: string;
  email: string;
  role: AdminRole;
  team: string | null;
}

interface AdminPortalContextValue {
  isReady: boolean;
  isAuthenticated: boolean;
  user: AdminUser | null;
  canAssignPriority: boolean;
  canManageAssignments: boolean;
  reports: AdminReport[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateStatus: (id: string, status: AdminWorkflowStatus) => void;
  assignPriority: (id: string, priority: AdminPriority) => void;
  assignTeam: (id: string, team: string) => void;
  addInternalNote: (id: string, message: string) => void;
  publishPublicUpdate: (id: string, message: string) => void;
}

const AdminPortalContext = createContext<AdminPortalContextValue>({
  isReady: false,
  isAuthenticated: false,
  user: null,
  canAssignPriority: false,
  canManageAssignments: false,
  reports: [],
  login: () => false,
  logout: () => {},
  updateStatus: () => {},
  assignPriority: () => {},
  assignTeam: () => {},
  addInternalNote: () => {},
  publishPublicUpdate: () => {},
});

export function useAdminPortal() {
  return useContext(AdminPortalContext);
}

const ADMIN_SESSION_KEY = 'admin_portal_session';

function syncPublicUpdateNote(
  reportId: string,
  notes: AdminNote[],
  publicUpdate: AdminReport['publicUpdate']
) {
  if (!publicUpdate) return notes;

  const nextMessage = `Public update: ${publicUpdate.message}`;
  const nextAuthor = `${publicUpdate.authorName} (${publicUpdate.authorRole === 'employee' ? 'Employee' : 'Official'})`;
  const alreadySynced = notes.some(
    (note) => note.message === nextMessage && note.createdAt === publicUpdate.updatedAt
  );

  if (alreadySynced) return notes;

  return [
    {
      id: `${reportId}-public-${new Date(publicUpdate.updatedAt).getTime()}`,
      author: nextAuthor,
      message: nextMessage,
      createdAt: publicUpdate.updatedAt,
    },
    ...notes,
  ];
}

export function AdminPortalProvider({ children }: { children: ReactNode }) {
  const { reports: appReports, updatePublicReport } = useApp();
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [reports, setReports] = useState<AdminReport[]>(ADMIN_PORTAL_REPORTS);

  useEffect(() => {
    (async () => {
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
    setReports((currentReports) => {
      const mergedReports = [...currentReports];

      appReports.forEach((appReport) => {
        const existingIndex = mergedReports.findIndex((report) => report.id === appReport.id);

        if (existingIndex === -1) {
          mergedReports.unshift({
            id: appReport.id,
            title:
              appReport.severityScore >= 7.5
                ? 'High-severity pothole cluster'
                : 'Road surface damage',
            category: appReport.severityScore >= 6 ? 'Pothole' : 'Road Surface',
            description:
              'Citizen-submitted roadway issue requiring city review and field verification.',
            imageUri: appReport.imageUri,
            location: appReport.location,
            severityScore: appReport.severityScore,
            priority: getPriorityFromScore(appReport.severityScore),
            status: appReport.status === 'fixed' ? 'resolved' : 'new',
            district: getDistrict(appReport.location.address),
            assignedTeam: 'Surface Crew Alpha',
            source: 'Resident App',
            reportedBy: 'Resident Mobile Intake',
            createdAt: new Date().toISOString(),
            updatedAt: appReport.publicUpdate?.updatedAt ?? new Date().toISOString(),
            publicUpdate: appReport.publicUpdate ?? null,
            notes: syncPublicUpdateNote(appReport.id, [], appReport.publicUpdate ?? null),
          });
          return;
        }

        const existingReport = mergedReports[existingIndex];
        const nextPublicUpdate = appReport.publicUpdate ?? existingReport.publicUpdate ?? null;
        mergedReports[existingIndex] = {
          ...existingReport,
          imageUri: appReport.imageUri,
          location: appReport.location,
          severityScore: appReport.severityScore,
          status:
            appReport.status === 'fixed'
              ? 'resolved'
              : existingReport.status === 'resolved'
                ? 'resolved'
                : existingReport.status,
          updatedAt: nextPublicUpdate?.updatedAt ?? existingReport.updatedAt,
          publicUpdate: nextPublicUpdate,
          notes: syncPublicUpdateNote(
            existingReport.id,
            existingReport.notes,
            appReport.publicUpdate ?? null
          ),
        };
      });

      return mergedReports;
    });
  }, [appReports]);

  const login = (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const matchedCredential = Object.values(ADMIN_DEMO_CREDENTIALS).find(
      (credential) =>
        credential.email === normalizedEmail && credential.password === normalizedPassword
    );

    if (!matchedCredential) return false;

    const nextUser = {
      name: matchedCredential.name,
      title: matchedCredential.title,
      email: matchedCredential.email,
      role: matchedCredential.role,
      team: matchedCredential.team,
    };
    setUser(nextUser);
    void AsyncStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(nextUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    void AsyncStorage.removeItem(ADMIN_SESSION_KEY);
  };

  const updateStatus = (id: string, status: AdminWorkflowStatus) => {
    updatePublicReport(id, { status: status === 'resolved' ? 'fixed' : 'open' });
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
    if (user?.role !== 'official') return;

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

  const assignTeam = (id: string, team: string) => {
    if (user?.role !== 'employee') return;

    const trimmedTeam = team.trim();
    if (!trimmedTeam) return;

    const nextTimestamp = new Date().toISOString();

    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === id
          ? {
              ...report,
              assignedTeam: trimmedTeam,
              status: report.status === 'new' ? 'assigned' : report.status,
              notes: [
                {
                  id: `${report.id}-assign-${Date.now()}`,
                  author: `${user.name} (${user.team ?? 'Field Ops'})`,
                  message: `Assignment updated to ${trimmedTeam}.`,
                  createdAt: nextTimestamp,
                },
                ...report.notes,
              ],
              updatedAt: nextTimestamp,
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
                  author: user?.name ?? 'Admin User',
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

  const publishPublicUpdate = (id: string, message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !user) return;

    const nextUpdatedAt = new Date().toISOString();
    const nextPublicUpdate: NonNullable<AdminReport['publicUpdate']> = {
      authorRole: user.role,
      authorName: user.name,
      message: trimmedMessage,
      updatedAt: nextUpdatedAt,
    };

    updatePublicReport(id, {
      publicUpdate: nextPublicUpdate,
    });

    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === id
          ? {
              ...report,
              publicUpdate: nextPublicUpdate,
              notes: syncPublicUpdateNote(report.id, report.notes, nextPublicUpdate),
              updatedAt: nextUpdatedAt,
            }
          : report
      )
    );
  };

  const value = {
    isReady,
    isAuthenticated: Boolean(user),
    user,
    canAssignPriority: user?.role === 'official',
    canManageAssignments: user?.role === 'employee',
    reports,
    login,
    logout,
    updateStatus,
    assignPriority,
    assignTeam,
    addInternalNote,
    publishPublicUpdate,
  };

  return <AdminPortalContext.Provider value={value}>{children}</AdminPortalContext.Provider>;
}
