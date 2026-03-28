/**
 * Report service - handles report CRUD and image analysis
 */

import { fetchApi, fetchApiMultipart, API_BASE_URL, ApiError } from './api';
import type {
  ApiReport,
  ApiReportWithUser,
  ApiReportCreate,
  ApiReportStatusUpdate,
  ReportStatus,
  ImageAnalysisResponse,
} from '@/types/api';

/**
 * Get all reports with optional filters
 */
export async function getReports(options?: {
  userId?: string;
  status?: ReportStatus;
  minSeverity?: number;
  skip?: number;
  limit?: number;
}): Promise<ApiReport[]> {
  const params = new URLSearchParams();
  
  if (options?.userId) params.append('user_id', options.userId);
  if (options?.status) params.append('status', options.status);
  if (options?.minSeverity) params.append('min_severity', options.minSeverity.toString());
  if (options?.skip) params.append('skip', options.skip.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  
  const query = params.toString();
  const endpoint = query ? `/reports?${query}` : '/reports';
  
  return fetchApi<ApiReport[]>(endpoint);
}

/**
 * Get a single report by ID with user info
 */
export async function getReportById(reportId: string): Promise<ApiReportWithUser | null> {
  try {
    return await fetchApi<ApiReportWithUser>(`/reports/${reportId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get reports for a specific user
 */
export async function getUserReports(userId: string): Promise<ApiReport[]> {
  return fetchApi<ApiReport[]>(`/users/${userId}/reports`);
}

/**
 * Create a new report without image
 */
export async function createReportWithoutImage(
  userId: string,
  reportData: ApiReportCreate
): Promise<ApiReport> {
  const params = new URLSearchParams({ user_id: userId });
  
  return fetchApi<ApiReport>(`/reports?${params.toString()}`, {
    method: 'POST',
    body: JSON.stringify(reportData),
  });
}

/**
 * Create a new report with image upload
 */
export async function createReportWithImage(
  userId: string,
  reportData: ApiReportCreate,
  imageUri: string
): Promise<ApiReport> {
  const formData = new FormData();
  
  // Add report data as JSON
  formData.append('latitude', reportData.latitude.toString());
  formData.append('longitude', reportData.longitude.toString());
  formData.append('address', reportData.address);
  formData.append('severity_score', reportData.severity_score.toString());
  formData.append('status', reportData.status || 'open');
  if (reportData.description) {
    formData.append('description', reportData.description);
  }
  
  // Add image file
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];
  
  formData.append('image', {
    uri: imageUri,
    name: `report.${fileType}`,
    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
  } as unknown as Blob);
  
  const params = new URLSearchParams({ user_id: userId });
  
  return fetchApiMultipart<ApiReport>(`/reports?${params.toString()}`, formData);
}

/**
 * Create a report - automatically handles image if provided
 */
export async function createReport(
  userId: string,
  reportData: ApiReportCreate,
  imageUri?: string
): Promise<ApiReport> {
  if (imageUri) {
    return createReportWithImage(userId, reportData, imageUri);
  }
  return createReportWithoutImage(userId, reportData);
}

/**
 * Update report status
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
): Promise<ApiReport> {
  const update: ApiReportStatusUpdate = { status };
  
  return fetchApi<ApiReport>(`/reports/${reportId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(update),
  });
}

/**
 * Analyze an image using the backend's Gemini integration
 */
export async function analyzeImage(
  imageUri: string,
  prompt: string = 'Analyze this road damage image and provide a severity assessment.'
): Promise<ImageAnalysisResponse> {
  const formData = new FormData();
  
  // Add image file
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];
  
  formData.append('file', {
    uri: imageUri,
    name: `analyze.${fileType}`,
    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
  } as unknown as Blob);
  
  formData.append('prompt', prompt);
  
  return fetchApiMultipart<ImageAnalysisResponse>('/analyze-image', formData);
}

/**
 * Analyze an image with additional context
 */
export async function analyzeImageWithContext(
  imageUri: string,
  prompt: string,
  context: string
): Promise<ImageAnalysisResponse> {
  const formData = new FormData();
  
  // Add image file
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];
  
  formData.append('file', {
    uri: imageUri,
    name: `analyze.${fileType}`,
    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
  } as unknown as Blob);
  
  formData.append('prompt', prompt);
  formData.append('context', context);
  
  return fetchApiMultipart<ImageAnalysisResponse>('/analyze-image-with-context', formData);
}

/**
 * Get the full URL for an image path from the backend
 */
export function getImageUrl(imagePath: string | null): string {
  if (!imagePath) return '';
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http')) return imagePath;
  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}
