import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { MOCK_REPORTS, type Report } from '@/data/mockReports';
import { getOrCreateUser, updateUserProfile } from '@/services/userService';
import { getReports, createReport as apiCreateReport, updateReportStatus as apiUpdateReportStatus } from '@/services/reportService';
import { apiReportToLocal, type ApiUser, type ApiReportCreate } from '@/types/api';
import { API_BASE_URL } from '@/services/api';

const STORAGE_KEY = 'device_uuid';
const NAME_KEY = 'display_name';
const AVATAR_KEY = 'avatar_uri';

interface AppContextValue {
  // Device & user info
  deviceUuid: string | null;
  userId: string | null; // Backend user ID (UUID)
  displayName: string;
  setDisplayName: (name: string) => void;
  avatarUri: string | null;
  setAvatarUri: (uri: string | null) => void;
  
  // Admin mode
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  
  // Reports
  reports: Report[];
  addReport: (report: Report, imageUri?: string) => Promise<void>;
  updateReportStatus: (id: string, status: 'open' | 'fixed') => Promise<void>;
  refreshReports: () => Promise<void>;
  
  // Loading & error states
  isLoading: boolean;
  isOnline: boolean;
  error: string | null;
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
  addReport: async () => {},
  updateReportStatus: async () => {},
  refreshReports: async () => {},
  isLoading: true,
  isOnline: true,
  error: null,
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
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reports from backend
  const refreshReports = useCallback(async () => {
    try {
      setError(null);
      const apiReports = await getReports();
      const localReports = apiReports.map(r => apiReportToLocal(r, API_BASE_URL));
      setReports(localReports);
      setIsOnline(true);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setIsOnline(false);
      // Keep existing reports or use mock data as fallback
      if (reports.length === 0) {
        // Seed with mock data if we have no reports
        const seeded = MOCK_REPORTS.map((r, i) =>
          i < 3 && deviceUuid ? { ...r, userId: deviceUuid } : { ...r }
        );
        setReports(seeded);
      }
    }
  }, [deviceUuid, reports.length]);

  // Initialize device UUID and user
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get or create device UUID
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

        // Try to register/get user from backend
        try {
          const user = await getOrCreateUser(uuid, savedName || 'StreetSense User');
          setUserId(user.id);
          
          // Sync display name from backend if different
          if (user.username && user.username !== savedName) {
            setDisplayNameState(user.username);
            await AsyncStorage.setItem(NAME_KEY, user.username);
          }
          
          setIsOnline(true);
          
          // Fetch reports from backend
          const apiReports = await getReports();
          const localReports = apiReports.map(r => apiReportToLocal(r, API_BASE_URL));
          setReports(localReports);
        } catch (apiErr) {
          console.error('Backend unavailable, using offline mode:', apiErr);
          setIsOnline(false);
          
          // Fallback: seed mock reports
          const seeded = MOCK_REPORTS.map((r, i) =>
            i < 3 ? { ...r, userId: uuid! } : { ...r }
          );
          setReports(seeded);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize app');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Update display name (syncs to backend if online)
  const setDisplayName = useCallback(async (name: string) => {
    setDisplayNameState(name);
    await AsyncStorage.setItem(NAME_KEY, name);
    
    // Sync to backend if we have a user ID
    if (userId && isOnline) {
      try {
        await updateUserProfile(userId, { username: name });
      } catch (err) {
        console.error('Failed to sync username to backend:', err);
      }
    }
  }, [userId, isOnline]);

  // Update avatar
  const setAvatarUri = useCallback(async (uri: string | null) => {
    setAvatarUriState(uri);
    if (uri) await AsyncStorage.setItem(AVATAR_KEY, uri);
    else await AsyncStorage.removeItem(AVATAR_KEY);
  }, []);

  // Add a new report
  const addReport = useCallback(async (report: Report, imageUri?: string) => {
    // Optimistically add to local state
    setReports((prev) => [report, ...prev]);
    
    if (userId && isOnline) {
      try {
        const apiReportData: ApiReportCreate = {
          latitude: report.location.lat,
          longitude: report.location.lng,
          address: report.location.address,
          severity_score: report.severityScore,
          status: report.status,
          description: null,
        };
        
        const createdReport = await apiCreateReport(userId, apiReportData, imageUri);
        
        // Update the local report with the server-generated ID
        setReports((prev) => 
          prev.map((r) => 
            r.id === report.id 
              ? apiReportToLocal(createdReport, API_BASE_URL)
              : r
          )
        );
      } catch (err) {
        console.error('Failed to create report on backend:', err);
        // Keep the local report but mark as not synced
        // Could add a 'synced' flag to Report type in future
      }
    }
  }, [userId, isOnline]);

  // Update report status
  const updateReportStatus = useCallback(
    async (id: string, status: 'open' | 'fixed') => {
      // Optimistically update local state
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      
      if (isOnline) {
        try {
          await apiUpdateReportStatus(id, status);
        } catch (err) {
          console.error('Failed to update report status on backend:', err);
          // Revert on failure
          setReports((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: status === 'open' ? 'fixed' : 'open' } : r))
          );
        }
      }
    },
    [isOnline]
  );

  return (
    <AppContext.Provider
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
        refreshReports,
        isLoading,
        isOnline,
        error,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
