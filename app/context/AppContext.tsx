import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { MOCK_REPORTS, type Report } from '@/data/mockReports';
import {
  ensureUser,
  createReport as apiCreateReport,
  getUserReports,
  updateReportStatus as apiUpdateReportStatus,
  type ApiReport,
  toImageUrl,
} from '@/lib/api';

const STORAGE_KEY = 'device_uuid';
// Combined keys from both branches
const NAME_KEY = 'display_name';
const AVATAR_KEY = 'avatar_uri';
const REPORTS_STORAGE_KEY = 'streetsense_reports';

interface AppContextValue {
  deviceUuid: string | null;
  userId: string | null;
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
  userId: null,
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
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayNameState] = useState('StreetSense User');
  const [avatarUri, setAvatarUriState] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [hasLoadedReports, setHasLoadedReports] = useState(false);

  const mapApiReportToReport = useCallback((apiReport: ApiReport): Report => {
    return {
      id: apiReport.id,
      imageUri: toImageUrl(apiReport.image_path),
      location: {
        lat: apiReport.latitude,
        lng: apiReport.longitude,
        address: apiReport.address,
      },
      severityScore: apiReport.severity_score,
      status: apiReport.status,
      userId: apiReport.user_id,
      publicUpdate: null,
    };
  }, []);

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

  // Fetch / create backend user and sync reports from FastAPI
  useEffect(() => {
    if (!deviceUuid) return;

    void (async () => {
      try {
        const backendUser = await ensureUser(deviceUuid, displayName);
        setUserId(backendUser.id);

        const backendReports = await getUserReports(backendUser.id);
        setReports(backendReports.map(mapApiReportToReport));
      } catch (error) {
        console.warn('Failed to sync reports from API', error);
      } finally {
        setHasLoadedReports(true);
      }
    })();
  }, [deviceUuid, displayName, mapApiReportToReport]);

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
    // Optimistic add locally
    setReports((prev) => [report, ...prev]);

    if (!userId) return;

    void (async () => {
      try {
        const created = await apiCreateReport({
          userId,
          latitude: report.location.lat,
          longitude: report.location.lng,
          address: report.location.address,
          severityScore: report.severityScore,
          status: report.status,
          imageUri: report.imageUri || undefined,
        });

        const mapped = mapApiReportToReport(created);
        setReports((prev) => [mapped, ...prev.filter((r) => r.id !== report.id)]);
      } catch (error) {
        console.warn('Failed to send report to API', error);
      }
    })();
  }, [mapApiReportToReport, userId]);

  const updateReportStatus = useCallback(
    (id: string, status: 'open' | 'fixed') => {
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );

      void (async () => {
        try {
          const updated = await apiUpdateReportStatus(id, status);
          const mapped = mapApiReportToReport(updated);
          setReports((prev) =>
            prev.map((r) => (r.id === id ? mapped : r))
          );
        } catch (error) {
          console.warn('Failed to update report status in API', error);
        }
      })();
    },
    [mapApiReportToReport]
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
        userId,
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
