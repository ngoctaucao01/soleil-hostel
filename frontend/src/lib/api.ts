/**
 * API Client with Automatic Token Refresh
 *
 * Frontend (React) implementation cho token expiration + automatic refresh
 *
 * Flow:
 * 1. Request goes out dengan token
 * 2. Server returns 401 (token expired/revoked)
 * 3. Axios interceptor catches 401
 * 4. Auto call POST /api/auth/refresh (nếu refresh token available)
 * 5. Retry original request dengan new token
 * 6. Nếu refresh fail → redirect to login
 *
 * Installation:
 * npm install axios
 *
 * Usage:
 * import { apiClient } from '@/lib/api'
 * const data = await apiClient.get('/api/bookings')
 *
 * Token Storage:
 * - sessionStorage.getItem('token') - Current access token
 * - localStorage.getItem('refreshToken') - Refresh token (persistent)
 *
 * On Token Refresh:
 * - sessionStorage.setItem('token', newToken)
 * - localStorage.setItem('refreshToken', newRefreshToken) // if applicable
 * - Retry original request
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

/**
 * API Client Configuration
 *
 * CORS Headers:
 * - Content-Type: application/json
 * - Accept: application/json
 *
 * Authorization Header:
 * - Bearer <token> from sessionStorage
 *
 * Timeout: 30 seconds
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * Flag: Prevent infinite refresh loop
 *
 * Nếu refresh endpoint fail → không retry vô tận
 * Set flag = true khi gọi refresh → skip interceptor response
 */
let isRefreshing = false

/**
 * Queue: Hold failed requests đợi token refresh
 *
 * Scenario:
 * - Request A → 401 (token expired) → queue
 * - Request B → 401 (token expired) → queue
 * - Refresh token → success
 * - Retry Request A + B với new token
 *
 * Avoid: Gọi refresh nhiều lần trong lúc đợi
 */
let failedQueue: {
  onSuccess: (token: string) => void
  onFailure: (error: AxiosError) => void
}[] = []

/**
 * Process Queue: Retry tất cả failed requests
 *
 * Called sau khi refresh token success
 */
const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.onFailure(error)
    } else if (token) {
      prom.onSuccess(token)
    }
  })

  failedQueue = []
}

/**
 * Request Interceptor: Add Authorization header
 *
 * Thêm token vào mỗi request:
 * Authorization: Bearer <token>
 *
 * Token lấy từ sessionStorage (set khi login)
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('token')

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => Promise.reject(error)
)

/**
 * Response Interceptor: Handle 401 → Refresh Token → Retry
 *
 * Error scenarios:
 * 1. 401 Token Expired → Call refresh → retry
 * 2. 401 Token Revoked → Redirect to login
 * 3. 401 Invalid Token → Redirect to login
 * 4. Other errors → Pass through
 *
 * Success:
 * - 2xx → Return response
 */
apiClient.interceptors.response.use(
  response => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // ========== Handle 401 Unauthorized ==========
    if (error.response?.status === 401 && !originalRequest._retry) {
      // ========== Check: Is this a refresh request? ==========
      // Nếu refresh endpoint trả 401 → không retry
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Refresh failed → force logout
        handleLogout()
        return Promise.reject(error)
      }

      // ========== Check: Is already refreshing? ==========
      if (isRefreshing) {
        // Đang refresh → queue request này
        return new Promise((onSuccess, onFailure) => {
          failedQueue.push({ onSuccess, onFailure })
        })
          .then((token: unknown) => {
            if (typeof token !== 'string') {
              return Promise.reject(new Error('Token must be a string'))
            }

            // Refresh success → retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch(err => {
            return Promise.reject(err)
          })
      }

      // ========== Mark: Refreshing ==========
      isRefreshing = true
      originalRequest._retry = true

      try {
        // ========== Call Refresh Endpoint ==========
        const response = await apiClient.post<{
          token: string
          expires_in_seconds: number
          type: string
        }>('/api/auth/refresh')

        const { token } = response.data

        // ========== Store New Token ==========
        sessionStorage.setItem('token', token)

        // Optional: Set expiration timer
        // setTimeout(() => {
        //   showTokenExpiringNotification(expires_in_seconds)
        // }, (expires_in_seconds - 300) * 1000)

        // ========== Process Queue: Retry all failed requests ==========
        processQueue(null, token)

        // ========== Retry Original Request ==========
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }

        return apiClient(originalRequest)
      } catch (refreshError) {
        // ========== Refresh Failed ==========
        // Token expired + refresh fail → force logout
        processQueue(refreshError as AxiosError, null)
        handleLogout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // ========== Handle Other Errors ==========
    if (error.response?.status === 403) {
      // Authorization error
      console.error('Bạn không có quyền thực hiện hành động này.')
    }

    return Promise.reject(error)
  }
)

/**
 * Handle Logout: Clear tokens + redirect to login
 *
 * Called khi:
 * - Refresh token fail (401 on /api/auth/refresh)
 * - 403 Unauthorized
 * - Manual logout
 */
function handleLogout() {
  // Clear tokens
  sessionStorage.removeItem('token')
  localStorage.removeItem('refreshToken')

  // Clear user data
  sessionStorage.removeItem('user')

  // Redirect to login
  window.location.href = '/login'
}

/**
 * Login Helper: Store token + redirect
 */
export const login = async (email: string, password: string, rememberMe: boolean = false) => {
  try {
    const response = await apiClient.post<{
      token: string
      expires_at: string
      expires_in_seconds: number
      type: string
      user: Record<string, unknown>
    }>('/api/auth/login', {
      email,
      password,
      remember_me: rememberMe,
    })

    const { token, user } = response.data

    // Store token
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))

    // If remember_me, store in localStorage (persistent)
    if (rememberMe) {
      localStorage.setItem('token', token)
    }

    return { success: true, user }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Logout Helper: Clear tokens + call logout endpoint
 */
export const logout = async () => {
  try {
    await apiClient.post('/api/auth/logout')
  } finally {
    handleLogout()
  }
}

/**
 * Logout All Devices: Force logout all sessions
 */
export const logoutAll = async () => {
  try {
    await apiClient.post('/api/auth/logout-all')
  } finally {
    handleLogout()
  }
}

/**
 * Get Current User Info
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/api/auth/me')
    return response.data
  } catch {
    return null
  }
}

/**
 * Setup Token Expiration Timer
 *
 * Display notification khi token sắp hết hạn (5 phút trước)
 *
 * Usage:
 * setupTokenExpirationWarning()
 */
export const setupTokenExpirationWarning = () => {
  getCurrentUser().then(data => {
    if (data?.token?.expires_in_seconds) {
      const expiringInMs = (data.token.expires_in_seconds - 300) * 1000 // 5 phút trước

      if (expiringInMs > 0) {
        setTimeout(() => {
          // Show notification or prompt to refresh
          console.warn('Token sắp hết hạn trong 5 phút. Vui lòng refresh.')

          // Optional: Auto-refresh
          // apiClient.post('/api/auth/refresh')
        }, expiringInMs)
      }
    }
  })
}

export default apiClient
