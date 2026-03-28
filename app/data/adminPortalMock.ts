export type AdminWorkflowStatus =
  | 'new'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'resolved';

export type AdminPriority = 'P1' | 'P2' | 'P3';
export type AdminRole = 'official';

export interface PublicReportUpdate {
  authorRole: 'official';
  authorName: string;
  message: string;
  updatedAt: string;
}

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

export const ADMIN_TEAMS = [
  'Surface Crew Alpha',
  'Rapid Patch Unit 4',
  'District North Response',
  'Roadway Maintenance 12',
  'Night Repair Team',
  'Structural Assessment Unit',
] as const;
