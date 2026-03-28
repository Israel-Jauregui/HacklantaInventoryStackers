/**
 * API Types - Matches FastAPI backend schemas
 */

// Enums
export type ReportStatus = 'open' | 'fixed';

// User types (matches backend UserRead schema)
export interface ApiUser {
  id: string;
  device_id: string;
  username: string;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiUserCreate {
  device_id: string;
  username: string;
  profile_picture?: string | null;
}

export interface ApiUserUpdate {
  username?: string;
}

// Report types (matches backend ReportRead schema)
export interface ApiReport {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address: string;
  severity_score: number;
  status: ReportStatus;
  description: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiReportWithUser extends ApiReport {
  user: ApiUser | null;
}

export interface ApiReportCreate {
  latitude: number;
  longitude: number;
  address: string;
  severity_score: number;
  status?: ReportStatus;
  description?: string | null;
}

export interface ApiReportStatusUpdate {
  status: ReportStatus;
}

// Image analysis types
export interface ImageAnalysisResponse {
  success: boolean;
  response: string;
  model: string;
}

// Local app Report type (from mockReports.ts)
import type { Report } from '@/data/mockReports';

// Transform functions
export function apiReportToLocal(api: ApiReport | ApiReportWithUser, baseUrl: string): Report {
  return {
    id: api.id,
    imageUri: api.image_path ? `${baseUrl}${api.image_path}` : '',
    location: {
      lat: api.latitude,
      lng: api.longitude,
      address: api.address,
    },
    severityScore: api.severity_score,
    status: api.status,
    userId: api.user_id,
  };
}

export function localReportToApiCreate(local: Partial<Report> & {
  latitude: number;
  longitude: number;
  address: string;
  severityScore: number;
  description?: string;
}): ApiReportCreate {
  return {
    latitude: local.latitude,
    longitude: local.longitude,
    address: local.address,
    severity_score: local.severityScore,
    status: local.status || 'open',
    description: local.description || null,
  };
}
