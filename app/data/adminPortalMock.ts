import { MOCK_REPORTS, type PublicReportUpdate } from '@/data/mockReports';
import { getDistrict, getPriorityFromScore } from '@/utils/adminPortal';

export type AdminWorkflowStatus =
  | 'new'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'resolved';

export type AdminPriority = 'P1' | 'P2' | 'P3';
export type AdminRole = 'official' | 'employee';

export interface AdminNote {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface AdminReport {
  id: string;
  title: string;
  category: 'Pothole' | 'Road Surface' | 'Hazard';
  description: string;
  imageUri: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  severityScore: number;
  priority: AdminPriority;
  status: AdminWorkflowStatus;
  district: string;
  assignedTeam: string;
  source: 'Resident App' | '311 Desk' | 'Camera Survey';
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
  publicUpdate: PublicReportUpdate | null;
  notes: AdminNote[];
}

const TEAMS = [
  'Surface Crew Alpha',
  'Rapid Patch Unit 4',
  'District North Response',
  'Roadway Maintenance 12',
  'Night Repair Team',
] as const;

export const ADMIN_TEAMS = [...TEAMS];

const STATUSES: AdminWorkflowStatus[] = [
  'new',
  'resolved',
  'triaged',
  'assigned',
  'in_progress',
  'assigned',
];

const SOURCES: AdminReport['source'][] = [
  'Resident App',
  '311 Desk',
  'Resident App',
  'Camera Survey',
  '311 Desk',
  'Resident App',
];

const REPORTERS = [
  'M. Jackson',
  '311 Queue',
  'R. Lopez',
  'Survey Vehicle 2',
  'Dispatch Intake',
  'A. Young',
] as const;

const CREATED_AT = [
  '2026-03-28T08:05:00.000Z',
  '2026-03-27T16:18:00.000Z',
  '2026-03-28T07:42:00.000Z',
  '2026-03-28T06:55:00.000Z',
  '2026-03-27T14:25:00.000Z',
  '2026-03-28T05:50:00.000Z',
] as const;

const EXTRA_REPORTS: AdminReport[] = [
  {
    id: 'ATL-2864',
    title: 'Recurring sinkhole patch failure',
    category: 'Road Surface',
    description:
      'Recurring failure at a previously patched location. Requires full-depth inspection before resurfacing.',
    imageUri: '',
    location: {
      lat: 33.752,
      lng: -84.401,
      address: '890 Marietta St NW',
    },
    severityScore: 8.8,
    priority: 'P1',
    status: 'triaged',
    district: 'Downtown Core',
    assignedTeam: 'Structural Assessment Unit',
    source: '311 Desk',
    reportedBy: 'Dispatch Intake',
    createdAt: '2026-03-28T07:20:00.000Z',
    updatedAt: '2026-03-28T08:10:00.000Z',
    publicUpdate: null,
    notes: [
      {
        id: 'note-extra-1',
        author: 'A. Grant',
        message: 'Escalated for structural review due to repeated resurfacing failure.',
        createdAt: '2026-03-28T08:12:00.000Z',
      },
    ],
  },
  {
    id: 'ATL-2861',
    title: 'Loose roadway debris near travel lane',
    category: 'Hazard',
    description:
      'Loose asphalt fragments reported near the lane edge. Requires quick clearance and patch assessment.',
    imageUri: '',
    location: {
      lat: 33.746,
      lng: -84.374,
      address: '640 Memorial Dr SE',
    },
    severityScore: 4.8,
    priority: 'P2',
    status: 'new',
    district: 'Westside Corridor',
    assignedTeam: 'Rapid Patch Unit 4',
    source: 'Resident App',
    reportedBy: 'L. Turner',
    createdAt: '2026-03-28T08:30:00.000Z',
    updatedAt: '2026-03-28T08:30:00.000Z',
    publicUpdate: null,
    notes: [],
  },
];

export const ADMIN_DEMO_CREDENTIALS = {
  official: {
    role: 'official' as const,
    email: 'admin@atlanta.gov',
    password: 'StreetOps2026',
    name: 'Jordan Ellis',
    title: 'City Operations Coordinator',
    team: null,
  },
  employee: {
    role: 'employee' as const,
    email: 'employee@atlanta.gov',
    password: 'FieldOps2026',
    name: 'Marcus Reed',
    title: 'Field Operations Employee',
    team: 'Roadway Maintenance 12',
  },
} as const;

export const ADMIN_PORTAL_REPORTS: AdminReport[] = [
  ...MOCK_REPORTS.map((report, index) => {
    const status = STATUSES[index % STATUSES.length];
    const district = getDistrict(report.location.address);
    const priority = getPriorityFromScore(report.severityScore);
    const createdAt = CREATED_AT[index % CREATED_AT.length];
    const updatedAt =
      report.publicUpdate?.updatedAt ??
      (status === 'resolved' ? '2026-03-28T07:55:00.000Z' : '2026-03-28T08:22:00.000Z');

    return {
      id: report.id,
      title: report.severityScore >= 7.5 ? 'High-severity pothole cluster' : 'Road surface damage',
      category: report.severityScore >= 6 ? 'Pothole' : 'Road Surface',
      description:
        'Citizen-submitted roadway issue requiring city review, crew assignment, and closeout verification.',
      imageUri: report.imageUri,
      location: report.location,
      severityScore: report.severityScore,
      priority,
      status,
      district,
      assignedTeam: TEAMS[index % TEAMS.length],
      source: SOURCES[index % SOURCES.length],
      reportedBy: REPORTERS[index % REPORTERS.length],
      createdAt,
      updatedAt,
      publicUpdate: report.publicUpdate ?? null,
      notes: [
        ...(report.publicUpdate
          ? [
              {
                id: `note-${report.id}-public`,
                author: `${report.publicUpdate.authorName} (${report.publicUpdate.authorRole === 'employee' ? 'Employee' : 'Official'})`,
                message: `Public update: ${report.publicUpdate.message}`,
                createdAt: report.publicUpdate.updatedAt,
              },
            ]
          : []),
        {
          id: `note-${report.id}-1`,
          author: 'J. Fields',
          message:
            status === 'resolved'
              ? 'Resolved in previous maintenance cycle. Keeping visible for audit trace.'
              : 'Verify lane width impact before final crew dispatch.',
          createdAt: updatedAt,
        },
      ],
    };
  }),
  ...EXTRA_REPORTS,
];
