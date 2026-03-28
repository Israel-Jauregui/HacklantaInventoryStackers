import { Alert, Linking, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import type {
  AdminPriority,
  AdminReport,
  AdminWorkflowStatus,
} from '@/data/adminPortalMock';

export function getPriorityFromScore(score: number): AdminPriority {
  if (score >= 7.5) return 'P1';
  if (score >= 4) return 'P2';
  return 'P3';
}

export function getPriorityColor(priority: AdminPriority): string {
  if (priority === 'P1') return Colors.red;
  if (priority === 'P2') return Colors.amber;
  return Colors.green;
}

export function getStatusColor(status: AdminWorkflowStatus): string {
  switch (status) {
    case 'new':
      return Colors.yellow;
    case 'triaged':
      return Colors.blue;
    case 'assigned':
      return Colors.amber;
    case 'in_progress':
      return Colors.green;
    case 'resolved':
      return Colors.green;
    default:
      return Colors.white;
  }
}

export function getStatusLabel(status: AdminWorkflowStatus): string {
  switch (status) {
    case 'new':
      return 'New Intake';
    case 'triaged':
      return 'Triaged';
    case 'assigned':
      return 'Assigned';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    default:
      return status;
  }
}

export function getDistrict(address: string): string {
  if (address.includes('Peachtree') || address.includes('Centennial')) return 'Downtown Core';
  if (address.includes('Piedmont') || address.includes('Ponce')) return 'Midtown East';
  if (address.includes('Auburn')) return 'Sweet Auburn';
  if (address.includes('North Ave')) return 'North Avenue';
  return 'Westside Corridor';
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getDashboardStats(reports: AdminReport[]) {
  const openStatuses = reports.filter((report) => report.status !== 'resolved');
  return {
    total: reports.length,
    open: openStatuses.length,
    resolved: reports.filter((report) => report.status === 'resolved').length,
    p1: reports.filter((report) => report.priority === 'P1').length,
    triageReady: reports.filter((report) => report.status === 'new').length,
  };
}

interface OpenMapsOptions {
  label: string;
  query: string;
  latitude?: number;
  longitude?: number;
}

async function openGoogleMaps({
  query,
  latitude,
  longitude,
}: OpenMapsOptions) {
  const encodedQuery = encodeURIComponent(query);
  const googleAppUrl =
    latitude !== undefined && longitude !== undefined
      ? `comgooglemaps://?center=${latitude},${longitude}&q=${encodedQuery}`
      : `comgooglemaps://?q=${encodedQuery}`;
  const googleWebUrl =
    latitude !== undefined && longitude !== undefined
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  const canOpenGoogleApp = await Linking.canOpenURL(googleAppUrl);
  await Linking.openURL(canOpenGoogleApp ? googleAppUrl : googleWebUrl);
}

async function openAppleMaps({
  query,
  latitude,
  longitude,
}: OpenMapsOptions) {
  const encodedQuery = encodeURIComponent(query);
  const appleUrl =
    latitude !== undefined && longitude !== undefined
      ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedQuery}`
      : `http://maps.apple.com/?q=${encodedQuery}`;

  await Linking.openURL(appleUrl);
}

export function openMapsChooser(options: OpenMapsOptions) {
  const buttons = [
    {
      text: 'Google Maps',
      onPress: () => {
        void openGoogleMaps(options);
      },
    },
    ...(Platform.OS === 'ios'
      ? [
          {
            text: 'Apple Maps',
            onPress: () => {
              void openAppleMaps(options);
            },
          },
        ]
      : []),
    {
      text: 'Cancel',
      style: 'cancel' as const,
    },
  ];

  Alert.alert(`Open ${options.label}`, 'Choose a maps app', buttons);
}
