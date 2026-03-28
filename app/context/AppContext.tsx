import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { MOCK_REPORTS, type Report } from '@/data/mockReports';

const STORAGE_KEY = 'device_uuid';
const NAME_KEY = 'display_name';
const AVATAR_KEY = 'avatar_uri';

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

  // Initialize device UUID and seed mock data
  useEffect(() => {
    (async () => {
      let uuid = await AsyncStorage.getItem(STORAGE_KEY);
      if (!uuid) {
        uuid = Crypto.randomUUID();
        await AsyncStorage.setItem(STORAGE_KEY, uuid);
      }
      setDeviceUuid(uuid);

      // Restore persisted name & avatar
      const savedName = await AsyncStorage.getItem(NAME_KEY);
      if (savedName) setDisplayNameState(savedName);
      const savedAvatar = await AsyncStorage.getItem(AVATAR_KEY);
      if (savedAvatar) setAvatarUriState(savedAvatar);

      // Patch the first 3 mock reports to belong to this device so profile isn't empty
      const seeded = MOCK_REPORTS.map((r, i) =>
        i < 3 ? { ...r, userId: uuid! } : { ...r }
      );
      setReports(seeded);
    })();
  }, []);

  const setDisplayName = useCallback(async (name: string) => {
    setDisplayNameState(name);
    await AsyncStorage.setItem(NAME_KEY, name);
  }, []);

  const setAvatarUri = useCallback(async (uri: string | null) => {
    setAvatarUriState(uri);
    if (uri) await AsyncStorage.setItem(AVATAR_KEY, uri);
    else await AsyncStorage.removeItem(AVATAR_KEY);
  }, []);

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

  return (
    <AppContext.Provider
      value={{ deviceUuid, displayName, setDisplayName, avatarUri, setAvatarUri, isAdmin, setIsAdmin, reports, addReport, updateReportStatus }}
    >
      {children}
    </AppContext.Provider>
  );
}
