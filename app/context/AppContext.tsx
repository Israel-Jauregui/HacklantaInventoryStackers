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
  publicUpdate?: string | null;
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
      
      const saved
