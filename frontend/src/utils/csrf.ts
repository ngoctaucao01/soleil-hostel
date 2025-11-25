/**
 * CSRF Token Management Utility
 *
 * IMPORTANT: CSRF tokens are stored in sessionStorage (NOT localStorage)
 * - sessionStorage is cleared when browser closes
 * - Reduces attack surface for CSRF token theft
 * - httpOnly cookie handles actual token security
 */

/**
 * Get CSRF token from sessionStorage
 *
 * Returns null if not set. Frontend adds this to X-XSRF-TOKEN header
 * for CSRF protection on non-GET requests.
 */
export function getCsrfToken(): string | null {
  return sessionStorage.getItem('csrf_token');
}

/**
 * Save CSRF token to sessionStorage
 *
 * Called after successful login/refresh response.
 * Backend includes csrf_token in response body for this purpose.
 */
export function setCsrfToken(token: string): void {
  sessionStorage.setItem('csrf_token', token);
}

/**
 * Clear CSRF token from sessionStorage
 *
 * Called on logout to remove CSRF token.
 * SessionStorage clears on browser close anyway, but good practice to explicit clear.
 */
export function clearCsrfToken(): void {
  sessionStorage.removeItem('csrf_token');
}

/**
 * Pre-fetch CSRF token before login (optional optimization)
 *
 * Useful for reducing latency on login form submission.
 * Fetches from public endpoint: GET /api/auth/csrf-token
 *
 * Usage in App.tsx:
 * useEffect(() => {
 *   fetchCsrfToken().catch(() => {});  // Non-blocking
 * }, []);
 */
export async function fetchCsrfToken(): Promise<string> {
  try {
    const api = (await import('../services/api').then((m) => m.default));
    const response = await api.get('/auth/csrf-token');
    const token = response.data.csrf_token;
    setCsrfToken(token);
    return token;
  } catch (error) {
    console.warn('Failed to pre-fetch CSRF token:', error);
    throw error;
  }
}
