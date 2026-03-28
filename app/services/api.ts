/**
 * Base API client for communicating with FastAPI backend
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://codehawks.org/dev';

export { API_BASE_URL };

interface FetchOptions extends RequestInit {
  timeout?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base fetch wrapper with error handling and timeout
 */
export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      throw new ApiError(
        errorData.detail || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }
    
    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw new ApiError(error.message, 0);
    }
    
    throw new ApiError('Unknown error occurred', 0);
  }
}

/**
 * Multipart form data fetch for file uploads
 */
export async function fetchApiMultipart<T>(
  endpoint: string,
  formData: FormData,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      ...fetchOptions,
      signal: controller.signal,
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      throw new ApiError(
        errorData.detail || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw new ApiError(error.message, 0);
    }
    
    throw new ApiError('Unknown error occurred', 0);
  }
}

/**
 * Check if the API is reachable
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    await fetchApi<{ Hello: string }>('/', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
