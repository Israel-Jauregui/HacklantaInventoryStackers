/**
 * User service - handles user registration and profile management
 */

import { fetchApi, fetchApiMultipart, ApiError } from './api';
import type { ApiUser, ApiUserCreate, ApiUserUpdate } from '@/types/api';

/**
 * Get user by device ID
 */
export async function getUserByDeviceId(deviceId: string): Promise<ApiUser | null> {
  try {
    return await fetchApi<ApiUser>(`/users/device/${deviceId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get user by UUID
 */
export async function getUserById(userId: string): Promise<ApiUser | null> {
  try {
    return await fetchApi<ApiUser>(`/users/${userId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(userData: ApiUserCreate): Promise<ApiUser> {
  return fetchApi<ApiUser>('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/**
 * Get or create user by device ID
 * Returns existing user if found, creates new one if not
 */
export async function getOrCreateUser(
  deviceId: string,
  defaultUsername: string = 'StreetSense User'
): Promise<ApiUser> {
  // Try to get existing user
  const existingUser = await getUserByDeviceId(deviceId);
  if (existingUser) {
    return existingUser;
  }
  
  // Create new user
  return createUser({
    device_id: deviceId,
    username: defaultUsername,
  });
}

/**
 * Update user profile (username)
 */
export async function updateUserProfile(
  userId: string,
  update: ApiUserUpdate
): Promise<ApiUser> {
  return fetchApi<ApiUser>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(update),
  });
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(
  userId: string,
  imageUri: string
): Promise<ApiUser> {
  const formData = new FormData();
  
  // Get file extension from URI
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];
  
  // Create file object for React Native
  formData.append('file', {
    uri: imageUri,
    name: `profile.${fileType}`,
    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
  } as unknown as Blob);
  
  return fetchApiMultipart<ApiUser>(`/users/${userId}/profile-picture`, formData);
}
