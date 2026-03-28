import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { MOCK_REPORTS, type Report } from '@/data/mockReports';

const STORAGE_KEY = 'device_uuid';

interface AppContextValue {
  deviceUuid: string | null;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  reports: Report[];
  addReport: (report: Report) => void;
  updateReportStatus: (id: string, status: 'open' | 'fixed') => void;
}

const AppContext = createContext<AppContextValue>({
  deviceUuid: null,
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

      // Patch the first 3 mock reports to belong to this device so profile isn't empty
      const seeded = MOCK_REPORTS.map((r, i) =>
        i < 3 ? { ...r, userId: uuid! } : { ...r }
      );
      setReports(seeded);
    })();
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
      value={{ deviceUuid, isAdmin, setIsAdmin, reports, addReport, updateReportStatus }}
    >
      {children}
    </AppContext.Provider>
  );
}
