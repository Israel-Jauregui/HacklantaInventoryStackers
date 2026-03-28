export interface PublicReportUpdate {
  authorRole: 'employee' | 'official';
  authorName: string;
  message: string;
  updatedAt: string;
}

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
  publicUpdate?: PublicReportUpdate | null;
}

// Placeholder userId — will be patched to real device UUID on context init
const DEMO_USER = 'demo-user';

export const MOCK_REPORTS: Report[] = [
  {
    id: 'ATL-2847',
    imageUri: '',
    location: { lat: 33.749, lng: -84.388, address: '123 Peachtree St NE' },
    severityScore: 8.2,
    status: 'open',
    userId: DEMO_USER,
    publicUpdate: null,
  },
  {
    id: 'ATL-2831',
    imageUri: '',
    location: { lat: 33.753, lng: -84.386, address: '456 Piedmont Ave NE' },
    severityScore: 5.4,
    status: 'fixed',
    userId: DEMO_USER,
    publicUpdate: {
      authorRole: 'employee',
      authorName: 'Roadway Maintenance 12',
      message: 'Crew patched the damaged section and reopened the lane after inspection.',
      updatedAt: '2026-03-28T07:55:00.000Z',
    },
  },
  {
    id: 'ATL-2819',
    imageUri: '',
    location: { lat: 33.757, lng: -84.392, address: '789 Ponce de Leon Ave' },
    severityScore: 3.1,
    status: 'open',
    userId: DEMO_USER,
    publicUpdate: null,
  },
  {
    id: 'ATL-2805',
    imageUri: '',
    location: { lat: 33.744, lng: -84.395, address: '321 Auburn Ave NE' },
    severityScore: 9.0,
    status: 'open',
    userId: 'other-user-001',
    publicUpdate: null,
  },
  {
    id: 'ATL-2798',
    imageUri: '',
    location: { lat: 33.761, lng: -84.381, address: '555 North Ave NW' },
    severityScore: 6.7,
    status: 'fixed',
    userId: 'other-user-001',
    publicUpdate: {
      authorRole: 'employee',
      authorName: 'Rapid Patch Unit 4',
      message: 'Temporary repair completed. Full resurfacing remains scheduled for next cycle.',
      updatedAt: '2026-03-27T16:18:00.000Z',
    },
  },
  {
    id: 'ATL-2790',
    imageUri: '',
    location: { lat: 33.748, lng: -84.390, address: '100 Centennial Olympic Park Dr' },
    severityScore: 4.2,
    status: 'open',
    userId: 'other-user-002',
    publicUpdate: null,
  },
];
