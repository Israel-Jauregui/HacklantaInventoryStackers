const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export type ApiUser = {
  id: string;
  device_id: string;
  username: string;
  profile_picture: string | null;
};

export type ApiReport = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address: string;
  severity_score: number;
  status: 'open' | 'fixed';
  description?: string | null;
  image_path?: string | null;
  created_at: string;
  updated_at: string;
};

function withBase(path: string) {
  return `${API_BASE}${path}`;
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getUserByDevice(deviceId: string): Promise<ApiUser | null> {
  const res = await fetch(withBase(`/users/device/${encodeURIComponent(deviceId)}`));
  if (res.status === 404) return null;
  return handleJson<ApiUser>(res);
}

export async function createUser(deviceId: string, username: string): Promise<ApiUser> {
  const res = await fetch(withBase('/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, username }),
  });
  return handleJson<ApiUser>(res);
}

export async function ensureUser(deviceId: string, username: string): Promise<ApiUser> {
  const existing = await getUserByDevice(deviceId);
  if (existing) return existing;
  return createUser(deviceId, username || 'StreetSense User');
}

export type CreateReportPayload = {
  userId: string;
  latitude: number;
  longitude: number;
  address: string;
  severityScore: number;
  status?: 'open' | 'fixed';
  description?: string | null;
  imageUri?: string | null;
};

export async function createReport(payload: CreateReportPayload): Promise<ApiReport> {
  const form = new FormData();
  form.append('user_id', payload.userId);
  form.append('latitude', String(payload.latitude));
  form.append('longitude', String(payload.longitude));
  form.append('address', payload.address);
  form.append('severity_score', String(payload.severityScore));
  if (payload.status) form.append('status', payload.status);
  if (payload.description) form.append('description', payload.description);

  if (payload.imageUri) {
    const name = payload.imageUri.split('/').pop() || `report-${Date.now()}.jpg`;
    form.append('image', {
      // @ts-expect-error FormData file for React Native
      uri: payload.imageUri,
      name,
      type: 'image/jpeg',
    });
  }

  const res = await fetch(withBase('/reports'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: form,
  });

  return handleJson<ApiReport>(res);
}

export async function getUserReports(userId: string): Promise<ApiReport[]> {
  const res = await fetch(withBase(`/users/${userId}/reports`));
  return handleJson<ApiReport[]>(res);
}

export async function listReports(): Promise<ApiReport[]> {
  const res = await fetch(withBase('/reports'));
  return handleJson<ApiReport[]>(res);
}

export async function updateReportStatus(
  reportId: string,
  status: 'open' | 'fixed'
): Promise<ApiReport> {
  const res = await fetch(withBase(`/reports/${reportId}/status?status=${status}`), {
    method: 'PATCH',
  });
  return handleJson<ApiReport>(res);
}

export function toImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return withBase(imagePath.startsWith('/') ? imagePath : `/${imagePath}`);
}

export { API_BASE };
