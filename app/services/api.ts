/**
 * StreetSense API service layer.
 *
 * All network requests route through here so the rest of the app never
 * hard-codes URLs or fetch logic.
 */

const API_BASE = 'https://codehawks.org/dev';
const UPLOADS_BASE = 'https://codehawks.org/uploads';

/* ────────────────────────── helpers ────────────────────────── */

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

/** Convert a relative image_path ("/uploads/abc.jpg") to a full URL. */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // path looks like "/uploads/xyz.jpg" → strip leading /uploads/
  const filename = path.replace(/^\/?uploads\//, '');
  return `${UPLOADS_BASE}/${filename}`;
}

/* ────────────────────────── types ────────────────────────── */

export interface ApiUser {
  id: string;
  device_id: string;
  username: string;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiReport {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address: string;
  severity_score: number;
  status: 'open' | 'fixed';
  description: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiReportWithUser extends ApiReport {
  user: ApiUser | null;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  profile_picture: string | null;
  score: number;
  report_count: number;
}

export interface PotholeAnalysis {
  severity_score: number;
  severity_label: string;
  description: string;
  dimensions: string;
  damage_estimate: string;
}

/* ────────────────────────── users ────────────────────────── */

/** Register a new user (or get 400 if device_id already exists). */
export async function registerUser(
  deviceId: string,
  username: string,
): Promise<ApiUser> {
  return request<ApiUser>('/users', {
    method: 'POST',
    body: JSON.stringify({ device_id: deviceId, username }),
  });
}

/** Look up a user by their device ID. Returns null if not found. */
export async function getUserByDevice(deviceId: string): Promise<ApiUser | null> {
  try {
    return await request<ApiUser>(`/users/device/${encodeURIComponent(deviceId)}`);
  } catch {
    return null;
  }
}

/** Get a user by UUID. */
export async function getUser(userId: string): Promise<ApiUser> {
  return request<ApiUser>(`/users/${userId}`);
}

/** Update a user's profile fields. */
export async function updateUser(
  userId: string,
  data: { username?: string; profile_picture?: string | null },
): Promise<ApiUser> {
  return request<ApiUser>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** Upload a profile picture. Returns the updated user. */
export async function uploadProfilePicture(
  userId: string,
  uri: string,
): Promise<ApiUser> {
  const form = new FormData();
  form.append('image', {
    uri,
    name: 'profile.jpg',
    type: 'image/jpeg',
  } as any);

  const res = await fetch(`${API_BASE}/users/${userId}/profile-picture`, {
    method: 'POST',
    body: form,
    // Let fetch set the multipart boundary automatically
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

/* ────────────────────────── reports ────────────────────────── */

/** Fetch all reports (with optional filters). */
export async function getReports(params?: {
  user_id?: string;
  status?: 'open' | 'fixed';
  min_severity?: number;
  skip?: number;
  limit?: number;
}): Promise<ApiReport[]> {
  const qs = new URLSearchParams();
  if (params?.user_id) qs.set('user_id', params.user_id);
  if (params?.status) qs.set('status', params.status);
  if (params?.min_severity != null) qs.set('min_severity', String(params.min_severity));
  if (params?.skip != null) qs.set('skip', String(params.skip));
  if (params?.limit != null) qs.set('limit', String(params.limit));
  const q = qs.toString();
  return request<ApiReport[]>(`/reports${q ? `?${q}` : ''}`);
}

/** Get a single report with user info. */
export async function getReport(reportId: string): Promise<ApiReportWithUser> {
  return request<ApiReportWithUser>(`/reports/${reportId}`);
}

/** Create a report, optionally uploading an image. */
export async function createReport(params: {
  userId: string;
  latitude: number;
  longitude: number;
  address: string;
  severityScore: number;
  description?: string;
  imageUri?: string;
}): Promise<ApiReport> {
  const form = new FormData();
  // FastAPI expects these as query params on the multipart endpoint,
  // so we build the URL with them.
  const qs = new URLSearchParams({
    user_id: params.userId,
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    address: params.address,
    severity_score: String(params.severityScore),
    status: 'open',
  });
  if (params.description) qs.set('description', params.description);

  if (params.imageUri) {
    form.append('image', {
      uri: params.imageUri,
      name: 'pothole.jpg',
      type: 'image/jpeg',
    } as any);
  }

  const res = await fetch(`${API_BASE}/reports?${qs.toString()}`, {
    method: 'POST',
    body: params.imageUri ? form : undefined,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Create report failed ${res.status}: ${body}`);
  }
  return res.json();
}

/** Update a report's status (admin: mark as fixed). */
export async function updateReportStatus(
  reportId: string,
  status: 'open' | 'fixed',
): Promise<ApiReport> {
  return request<ApiReport>(`/reports/${reportId}/status?status=${status}`, {
    method: 'PATCH',
  });
}

/* ───────────────────── Gemini / AI analysis ───────────────────── */

/** Analyze a pothole image via Gemini. */
export async function analyzePothole(imageUri: string): Promise<PotholeAnalysis> {
  const form = new FormData();
  form.append('image', {
    uri: imageUri,
    name: 'pothole.jpg',
    type: 'image/jpeg',
  } as any);

  const res = await fetch(`${API_BASE}/analyze-pothole`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
  return res.json();
}

/* ────────────────────────── leaderboard ────────────────────────── */

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  return request<LeaderboardEntry[]>(`/leaderboard?limit=${limit}`);
}
