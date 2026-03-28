/**
 * Report service - handles report CRUD and image analysis
 */

import { fetchApi, fetchApiMultipart, API_BASE_URL, ApiError } from './api';
import { compressImageForUpload } from './imageUtils';
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
 * Build query params for the /reports POST endpoint.
 * The backend declares all non-file params as query params.
 */
function buildReportQueryParams(
  userId: string,
  reportData: ApiReportCreate
): string {
  const params = new URLSearchParams({
    user_id: userId,
    latitude: reportData.latitude.toString(),
    longitude: reportData.longitude.toString(),
    address: reportData.address,
    severity_score: reportData.severity_score.toString(),
    status: reportData.status || 'open',
  });
  if (reportData.description) {
    params.append('description', reportData.description);
  }
  return params.toString();
}

/**
 * Create a new report without image
 */
export async function createReportWithoutImage(
  userId: string,
  reportData: ApiReportCreate
): Promise<ApiReport> {
  const query = buildReportQueryParams(userId, reportData);
  
  // Send an empty multipart form (backend still expects multipart due to File() param)
  const formData = new FormData();
  
  return fetchApiMultipart<ApiReport>(`/reports?${query}`, formData);
}

/**
 * Create a new report with image upload
 */
export async function createReportWithImage(
  userId: string,
  reportData: ApiReportCreate,
  imageUri: string
): Promise<ApiReport> {
  // Compress image before uploading to avoid 413 from server
  const compressedUri = await compressImageForUpload(imageUri);
  
  const query = buildReportQueryParams(userId, reportData);
  
  // Only the image goes in the form body
  const formData = new FormData();
  formData.append('image', {
    uri: compressedUri,
    name: 'report.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  
  return fetchApiMultipart<ApiReport>(`/reports?${query}`, formData);
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
  const compressedUri = await compressImageForUpload(imageUri);
  const formData = new FormData();
  
  formData.append('image', {
    uri: compressedUri,
    name: 'analyze.jpg',
    type: 'image/jpeg',
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
  const compressedUri = await compressImageForUpload(imageUri);
  const formData = new FormData();
  
  formData.append('image', {
    uri: compressedUri,
    name: 'analyze.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  
  formData.append('prompt', prompt);
  formData.append('context', context);
  
  return fetchApiMultipart<ImageAnalysisResponse>('/analyze-image-with-context', formData);
}

/**
 * Parsed result from AI pothole analysis
 */
export interface PotholeAnalysisResult {
  score: number;           // 0-10 severity score
  description: string;     // AI description of the pothole
  rawResponse: string;     // Full AI response text
}

/**
 * Analyze a pothole image and extract a severity score.
 * Sends a structured prompt so Gemini returns a parseable severity score.
 */
export async function analyzePotholeImage(imageUri: string): Promise<PotholeAnalysisResult> {
  const prompt = [
    'You are an AI road damage assessment tool.',
    'Analyze this image of a pothole or road damage.',
    'Respond with EXACTLY this format on the first line:',
    'SEVERITY: <number from 0.0 to 10.0>',
    'Then on subsequent lines, provide a brief description of the damage,',
    'including estimated dimensions and potential vehicle damage risk.',
    'If the image does not show road damage, respond with SEVERITY: 0.0 and explain why.',
  ].join(' ');

  const result = await analyzeImage(imageUri, prompt);

  // Parse severity score from response
  const severityMatch = result.response.match(/SEVERITY:\s*([\d.]+)/i);
  let score = severityMatch ? parseFloat(severityMatch[1]) : 5.0;

  // Clamp to 0-10 range
  score = Math.max(0, Math.min(10, score));

  // Round to 1 decimal
  score = Math.round(score * 10) / 10;

  // Extract description (everything after the SEVERITY line)
  const lines = result.response.split('\n');
  const descriptionLines = lines.slice(1).filter((l: string) => l.trim().length > 0);
  const description = descriptionLines.join(' ').trim() || 'Road damage detected.';

  return {
    score,
    description,
    rawResponse: result.response,
  };
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
