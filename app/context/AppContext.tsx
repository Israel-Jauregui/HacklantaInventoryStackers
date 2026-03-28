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
  };
}

interface AppContextValue {
  deviceUuid: string | null;
  /** The server-side user UUID (not the device id). */
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

  /* ─── Bootstrap: ensure user registered + fetch reports ─── */
  useEffect(() => {
    (async () => {
      // 1. Get or create device UUID
      let uuid = await AsyncStorage.getItem(STORAGE_KEY);
      if (!uuid) {
        uuid = Crypto.randomUUID();
        await AsyncStorage.setItem(STORAGE_KEY, uuid);
      }
      setDeviceUuid(uuid);

      // 2. Restore persisted display name & avatar
      const savedName = await AsyncStorage.getItem(NAME_KEY);
      if (savedName) setDisplayNameState(savedName);
      const savedAvatar = await AsyncStorage.getItem(AVATAR_KEY);
      if (savedAvatar) setAvatarUriState(savedAvatar);

      // 3. Register / look-up server user
      let suid = await AsyncStorage.getItem(SERVER_USER_KEY);
      if (!suid) {
        try {
          let user = await getUserByDevice(uuid);
          if (!user) {
            user = await registerUser(uuid, savedName ?? 'StreetSense User');
          }
          suid = user.id;
          await AsyncStorage.setItem(SERVER_USER_KEY, suid);
          // Sync name from server if we had none locally
          if (!savedName && user.username) {
            setDisplayNameState(user.username);
            await AsyncStorage.setItem(NAME_KEY, user.username);
          }
        } catch (err) {
          console.warn('Backend unreachable — running in offline mode', err);
        }
      }
      if (suid) setServerUserId(suid);

      // 4. Load reports
      try {
        const data = await getReports();
        setReports(data.map(toLocalReport));
      } catch (err) {
        console.warn('Could not load reports from server', err);
      }
    })();
  }, []);

  /* ─── Display name ─── */
  const setDisplayName = useCallback(
    async (name: string) => {
      setDisplayNameState(name);
      await AsyncStorage.setItem(NAME_KEY, name);
      if (serverUserId) {
        apiUpdateUser(serverUserId, { username: name }).catch(() => {});
      }
    },
    [serverUserId],
  );

  /* ─── Avatar ─── */
  const setAvatarUri = useCallback(
    async (uri: string | null) => {
      setAvatarUriState(uri);
      if (uri) await AsyncStorage.setItem(AVATAR_KEY, uri);
      else await AsyncStorage.removeItem(AVATAR_KEY);
    },
    [],
  );

  /* ─── Add report (optimistic + server sync) ─── */
  const addReport = useCallback((report: Report) => {
    setReports((prev) => [report, ...prev]);
  }, []);

  /* ─── Update report status ─── */
  const updateReportStatus = useCallback(
    (id: string, status: 'open' | 'fixed') => {
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
      apiUpdateReportStatus(id, status).catch(() => {});
    },
    [],
  );

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
        refreshReports,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
