import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { MOCK_REPORTS, type Report } from '@/data/mockReports';

const STORAGE_KEY = 'device_uuid';
// Combined keys from both branches
const NAME_KEY = 'display_name';
const AVATAR_KEY = 'avatar_uri';
const REPORTS_STORAGE_KEY = 'streetsense_reports';

interface AppContextValue {
  deviceUuid: string | null;
  displayName: string;
  setDisplayName: (name: string) => void;
  avatarUri: string | null;
  setAvatarUri: (uri: string | null) => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  reports: Report[];
  addReport: (report: Report) => void;
  updateReportStatus: (id: string, status: 'open' | 'fixed') => void;
  updatePublicReport: (
    id: string,
    patch: Partial<Pick<Report, 'status' | 'publicUpdate'>>
  ) => void;
}

const AppContext = createContext<AppContextValue>({
  deviceUuid: null,
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
});

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [deviceUuid, setDeviceUuid] = useState<string | null>(null);
  const [displayName, setDisplayNameState] = useState('StreetSense User');
  const [avatarUri, setAvatarUriState] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [hasLoadedReports, setHasLoadedReports] = useState(false);

  // Initialize device UUID and seed mock data
  useEffect(() => {
    (async () => {
      let uuid = await AsyncStorage.getItem(STORAGE_KEY);
      if (!uuid) {
        uuid = Crypto.randomUUID();
        await AsyncStorage.setItem(STORAGE_KEY, uuid);
      }
      setDeviceUuid(uuid);

      // Restore persisted name & avatar (from main)
      const savedName = await AsyncStorage.getItem(NAME_KEY);
      if (savedName) setDisplayNameState(savedName);
      const savedAvatar = await AsyncStorage.getItem(AVATAR_KEY);
      if (savedAvatar) setAvatarUriState(savedAvatar);

      // Restore stored reports (from adminBranch)
      const storedReports = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
      const baseReports = storedReports
        ? (JSON.parse(storedReports) as Report[])
        : MOCK_REPORTS;

      // Patch the first 3 mock reports to belong to this device so profile isn't empty
      const seeded = baseReports.map((r, i) =>
        i < 3 ? { ...r, userId: uuid! } : { ...r }
      );
      setReports(seeded);
      setHasLoadedReports(true);
    })();
  }, []);

  // Profile setters (from main)
  const setDisplayName = useCallback(async (name: string) => {
    setDisplayNameState(name);
    await AsyncStorage.setItem(NAME_KEY, name);
  }, []);

  const setAvatarUri = useCallback(async (uri: string | null) => {
    setAvatarUriState(uri);
    if (uri) await AsyncStorage.setItem(AVATAR_KEY, uri);
    else await AsyncStorage.removeItem(AVATAR_KEY);
  }, []);

  // Report sync effect (from adminBranch)
  useEffect(() => {
    if (!hasLoadedReports) return;
    void AsyncStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  }, [hasLoadedReports, reports]);

  const addReport = useCallback((report: Report) => {
    setReports((prev) => [report, ...prev]);
  }, []);

  const updateReportStatus = useCallback(
    (id: string, status: 'open' | 'fixed') => {
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    },
    []
  );

  const updatePublicReport = useCallback(
    (id: string, patch: Partial<Pick<Report, 'status' | 'publicUpdate'>>) => {
      setReports((prev) =>
        prev.map((report) =>
          report.id === id
            ? {
                ...report,
                ...patch,
              }
            : report
        )
      );
    },
    []
  );

  return (
    <AppContext.Provider
      // Combined values exposed to the app context
      value={{
        deviceUuid,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
