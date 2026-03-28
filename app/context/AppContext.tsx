import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  registerUser,
  getUserByDevice,
  updateUser as apiUpdateUser,
  getReports,
  createReport as apiCreateReport,
  updateReportStatus as apiUpdateReportStatus,
  imageUrl,
  type ApiReport,
} from '@/services/api';

const STORAGE_KEY = 'device_uuid';
const NAME_KEY = 'display_name';
const AVATAR_KEY = 'avatar_uri';
const SERVER_USER_KEY = 'server_user_id';
const REPORTS_STORAGE_KEY = 'streetsense_reports';

export interface Report {
  id: string;
  imageUri: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  severityScore: number;
  status: 'open' | 'fixed';
  userId: string;
  publicUpdate?: {
    authorRole: 'official';
    authorName: string;
    message: string;
    updatedAt: string;
  } | null;
}

/** Convert a backend report into the shape the UI expects. */
function toLocalReport(r: ApiReport): Report {
  return {
    id: r.id,
    imageUri: imageUrl(r.image_path) ?? '',
    location: { lat: r.latitude, lng: r.longitude, address: r.address },
    severityScore: r.severity_score,
    status: r.status,
    userId: r.user_id,
    publicUpdate: null, // Default for local UI
  };
}

interface AppContextValue {
  deviceUuid: string | null;
  serverUserId: string | null;
  displayName: string;
  setDisplayName: (name: string) => void;
  avatarUri: string | null;
  setAvatarUri: (uri: string | null) => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  reports: Report[];
  addReport: (report: Report) => void;
  updateReportStatus: (id: string, status: 'open' | 'fixed') => void;
  updatePublicReport: (id: string, patch: Partial<Pick<Report, 'status' | 'publicUpdate'>>) => void;
  refreshReports: () => Promise<void>;
}

const AppContext = createContext<AppContextValue>({
  deviceUuid: null,
  serverUserId: null,
  displayName: 'StreetSense User',
  setDisplayName: () => {},
  avatarUri: null,
  setAvatarUri: () => {},
  isAdmin: false,
  setIsAdmin: () => {},
  reports: [],
  addReport: () => {},
  updateReportStatus: () => {},
  updatePublicReport: () => {},
  refreshReports: async () => {},
});

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [deviceUuid, setDeviceUuid] = useState<string | null>(null);
  const [serverUserId, setServerUserId] = useState<string | null>(null);
  const [displayName, setDisplayNameState] = useState('StreetSense User');
  const [avatarUri, setAvatarUriState] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);

  /* ─── Fetch reports from backend ─── */
  const refreshReports = useCallback(async () => {
    try {
      const data = await getReports();
      setReports(data.map(toLocalReport));
    } catch (err) {
      console.warn('Failed to fetch reports, keeping local state', err);
    }
  }, []);

  /* ─── Bootstrap Flow ─── */
  useEffect(() => {
    (async () => {
      // 1. Get/Create Device UUID
      let uuid = await AsyncStorage.getItem(STORAGE_KEY);
      if (!uuid) {
        uuid = Crypto.randomUUID();
        await AsyncStorage.setItem(STORAGE_KEY, uuid);
      }
      setDeviceUuid(uuid);

      // 2. Restore Profile Settings
      const savedName = await AsyncStorage.getItem(NAME_KEY);
      if (savedName) setDisplayNameState(savedName);
      
      const savedAvatar = await AsyncStorage.getItem(AVATAR_KEY);
      if (savedAvatar) setAvatarUriState(savedAvatar);

      // 3. Register/Sync Server User
      let suid = await AsyncStorage.getItem(SERVER_USER_KEY);
      try {
        let user = await getUserByDevice(uuid);
        if (!user) {
          user = await registerUser(uuid, savedName ?? 'StreetSense User');
        }
        suid = user.id;
        await AsyncStorage.setItem(SERVER_USER_KEY, suid);
        
        if (!savedName && user.username) {
          setDisplayNameState(user.username);
          await AsyncStorage.setItem(NAME_KEY, user.username);
        }
      } catch (err) {
        console.warn('Server offline mode');
      }
      if (suid) setServerUserId(suid);

      // 4. Initial Report Load
      const stored = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
      if (stored) setReports(JSON.parse(stored));
      
      refreshReports();
    })();
  }, [refreshReports]);

  // Persist reports locally whenever they change
  useEffect(() => {
    if (reports.length > 0) {
      AsyncStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    }
  }, [reports]);

  /* ─── Actions ─── */
  const setDisplayName = useCallback(async (name: string) => {
    setDisplayNameState(name);
    await AsyncStorage.setItem(NAME_KEY, name);
    if (serverUserId) {
      apiUpdateUser(serverUserId, { username: name }).catch(() => {});
    }
  }, [serverUserId]);

  const setAvatarUri = useCallback(async (uri: string | null) => {
    setAvatarUriState(uri);
    if (uri) await AsyncStorage.setItem(AVATAR_KEY, uri);
    else await AsyncStorage.removeItem(AVATAR_KEY);
    
    if (serverUserId) {
      apiUpdateUser(serverUserId, { profile_picture: uri ?? undefined }).catch(() => {});
    }
  }, [serverUserId]);

  const addReport = useCallback((report: Report) => {
    setReports((prev) => [report, ...prev]);

    if (!serverUserId) return;

    void (async () => {
      try {
        const created = await apiCreateReport({
          userId: serverUserId,
          latitude: report.location.lat,
          longitude: report.location.lng,
          address: report.location.address,
          severityScore: report.severityScore,
          description: '', 
          imageUri: report.imageUri || undefined,
        });
        // Replace temp report with real server report
        setReports((prev) => 
          prev.map((r) => (r.id === report.id ? toLocalReport(created) : r))
        );
      } catch (error) {
        console.warn('API submission failed', error);
      }
    })();
  }, [serverUserId]);

  const updateReportStatus = useCallback((id: string, status: 'open' | 'fixed') => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    apiUpdateReportStatus(id, status).catch(() => {});
  }, []);

  const updatePublicReport = useCallback((id: string, patch: Partial<Pick<Report, 'status' | 'publicUpdate'>>) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        deviceUuid,
        serverUserId,
        displayName,
        setDisplayName,
        avatarUri,
        setAvatarUri,
        isAdmin,
        setIsAdmin,
        reports,
        addReport,
        updateReportStatus,
        updatePublicReport,
        refreshReports,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}