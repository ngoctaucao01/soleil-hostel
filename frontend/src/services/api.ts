import axios from 'axios';

// Read API base URL from Vite environment variable (VITE_API_URL).
// Using `import.meta.env` keeps the code compatible with Vite and allows
// different values in development / staging / production.
const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  // ⚡ CRITICAL: Enable httpOnly cookie sending
  // Browser automatically includes soleil_token in requests
  withCredentials: true,
});

/**
 * Request Interceptor: Add X-XSRF-TOKEN for CSRF protection
 *
 * CSRF Token Flow:
 * 1. Login response contains csrf_token
 * 2. Save to sessionStorage
 * 3. Add X-XSRF-TOKEN header to non-GET requests
 */
api.interceptors.request.use((config) => {
  // Only add CSRF token for non-GET requests
  if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const csrfToken = sessionStorage.getItem('csrf_token');
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  return config;
});

/**
 * Response Interceptor: Handle 401 with automatic refresh
 *
 * Token Expiration Flow:
 * 1. Protected endpoint returns 401
 * 2. Check if already retried (prevent infinite loop)
 * 3. Call /api/auth/refresh-httponly
 * 4. Retry original request
 * 5. If refresh also fails → logout + redirect
 */
api.interceptors.response.use(
  (response) => {
    // Success - return as-is
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Only retry on 401 Unauthorized, and only once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // ========== REFRESH TOKEN ==========
        // Browser automatically sends httpOnly cookie
        // Backend returns new csrf_token + refreshed token in new cookie
        const refreshResponse = await api.post('/auth/refresh-httponly');

        // Update CSRF token from refresh response
        if (refreshResponse.data.csrf_token) {
          sessionStorage.setItem('csrf_token', refreshResponse.data.csrf_token);
        }

        // ========== RETRY ORIGINAL REQUEST ==========
        // Now with new token in httpOnly cookie
        return api(originalRequest);
      } catch (refreshError) {
        // ========== REFRESH FAILED ==========
        // Token is invalid/expired/revoked - force logout
        sessionStorage.clear();
        localStorage.clear();  // Clear any remaining data

        // Redirect to login
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
