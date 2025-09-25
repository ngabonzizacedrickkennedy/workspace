// src/lib/api.ts - CRITICAL FIX for console errors
import axios, { AxiosError, AxiosResponse } from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// ENHANCED: Better error logging with context
interface ApiErrorContext {
  url?: string;
  method?: string;
  status?: number;
  message?: string;
}

// CRITICAL FIX: Improved logApiError function to prevent empty object logging
const logApiError = (error: AxiosError, context: ApiErrorContext = {}) => {
  const errorInfo = {
    url: error.config?.url || context.url || 'unknown',
    method: (error.config?.method?.toUpperCase() || context.method || 'unknown'),
    status: error.response?.status || context.status || 'unknown',
    message: error.message || context.message || 'No error message',
    data: error.response?.data || 'No response data',
    // ADDED: Include the actual error type for better debugging
    errorType: error.response ? 'HTTP_ERROR' : error.request ? 'NETWORK_ERROR' : 'REQUEST_SETUP_ERROR'
  };

  // CRITICAL FIX: Only log if we have meaningful information
  // Check if the object has actual values (not just undefined/unknown)
  const hasRealData = errorInfo.url !== 'unknown' || 
                      errorInfo.status !== 'unknown' || 
                      errorInfo.message !== 'No error message';

  if (hasRealData) {
    console.error('API Error Details:', errorInfo);
  }
};

// Request interceptor - add token and logging
api.interceptors.request.use(
  (config) => {
    // ✅ Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Log outgoing requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    // ✅ Better error handling for server vs client
    if (typeof window === 'undefined') {
      // Server-side error
      console.error('Server-side request error:', error.message);
    } else {
      // Client-side error
      console.error('⚙️ Request configuration error:', error.message);
    }
    return Promise.reject(error);
  }
);

// CRITICAL FIX: Response interceptor with improved error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // CRITICAL FIX: Better error handling to prevent empty object logging
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const url = error.config?.url;
      
      // Handle specific status codes with appropriate logging levels
      switch (status) {
        case 401:
          // CRITICAL FIX: For login errors, don't call logApiError which creates empty objects
          // Instead, log a simple, clear message
          if (url?.includes('/api/auth/login')) {
            console.warn('🔒 Login failed: Invalid credentials');
          } else {
            console.warn('🔒 Authentication required or token expired');
          }
          break;
        case 403:
          console.warn('🚫 Access forbidden - insufficient permissions');
          logApiError(error, { status, url });
          break;
        case 404:
          console.info('📭 Resource not found:', url);
          // 404s are often expected (empty cart, etc.) - don't log as errors
          break;
        case 500:
          console.error('🔥 Server error - this should be investigated');
          logApiError(error, { status, url });
          break;
        default:
          // For other errors, only log if we have meaningful data
          if (status && url) {
            console.error(`❌ HTTP ${status} error:`, error.message);
            logApiError(error, { status, url });
          }
      }
    } else if (error.request) {
      // Network error
      console.error('🌐 Network error - no response received:', error.message);
      // Don't call logApiError for network errors as they often have empty data
    } else {
      // Request setup error
      console.error('⚙️ Request configuration error:', error.message);
    }

    // CRITICAL: Only log to console, never call toast here to prevent circular dependencies
    // Toast calls should be handled in the service layer or components

    return Promise.reject(error);
  }
);

// ENHANCED: Helper functions for common API patterns
export const apiHelpers = {
  // Safe API call wrapper with better error handling
  async safeCall<T>(
    apiCall: () => Promise<AxiosResponse<T>>,
    options: {
      fallback?: T;
      silentErrors?: number[]; // Status codes to not log as errors
      context?: string;
    } = {}
  ): Promise<T | null> {
    try {
      const response = await apiCall();
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      
      // Check if this is a "silent" error (like 404 for empty cart)
      if (status && options.silentErrors?.includes(status)) {
        console.info(`Expected ${status} response${options.context ? ` for ${options.context}` : ''}`);
        return options.fallback || null;
      }
      
      // Log unexpected errors (but don't use logApiError to prevent empty objects)
      if (status && axiosError.config?.url) {
        console.error(`API Error in ${options.context || 'unknown context'}:`, {
          status,
          url: axiosError.config.url,
          message: axiosError.message
        });
      }
      return options.fallback || null;
    }
  },

  // Check if error is authentication related
  isAuthError(error: unknown): boolean {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 401;
  },

  // Check if error is server error
  isServerError(error: unknown): boolean {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 500;
  },

  // Check if error is not found
  isNotFoundError(error: unknown): boolean {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 404;
  },

  // Extract error message from API response
  getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
    const axiosError = error as AxiosError;
    
    // Try to get message from response data
    if (axiosError.response?.data) {
      const data = axiosError.response.data as any;
      if (data.message) return data.message;
      if (data.error) return data.error;
      if (typeof data === 'string') return data;
    }
    
    // Fallback to axios error message
    if (axiosError.message) return axiosError.message;
    
    return fallback;
  }
};

export default api;