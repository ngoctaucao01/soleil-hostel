import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface LoginProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

/**
 * Login Component - httpOnly Cookie Authentication
 *
 * ========== Flow ==========
 * 1. User fills email + password
 * 2. POST /api/auth/login-httponly
 * 3. Backend returns user + csrf_token
 * 4. Browser auto-stores token in httpOnly cookie
 * 5. CSRF token saved to sessionStorage
 * 6. Axios interceptor adds X-XSRF-TOKEN header
 * 7. XSS cannot steal token (it's in httpOnly cookie)
 */
const Login: React.FC<LoginProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { loginHttpOnly, loading: authLoading, error: authError, clearError } = useAuth()

  const [form, setForm] = useState({ email: '', password: '', rememberMe: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    })

    if (error) setError(null)
    if (authError) clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // ========== LOGIN WITH httpOnly COOKIE ==========
      await loginHttpOnly(form.email, form.password, form.rememberMe)

      // ✅ Token stored in httpOnly cookie (browser managed)
      // ✅ CSRF token saved to sessionStorage
      // ✅ Axios interceptor will auto-add X-XSRF-TOKEN header
      // ✅ XSS cannot access token

      setForm({ email: '', password: '', rememberMe: false })
      onSuccess?.()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const errorMsg = error?.response?.data?.message || error?.message || 'Login failed'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const isLoading = loading || authLoading
  const displayError = error || authError

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-blue-600">Login</h2>

      {displayError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-500 rounded-lg text-red-700 text-sm">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            placeholder="your@email.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={form.rememberMe}
            onChange={handleChange}
            disabled={isLoading}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="rememberMe" className="ml-2 text-sm font-medium">
            Remember me (30 days)
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-lg font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        Don't have an account?{' '}
        <button
          onClick={onSwitchToRegister}
          className="text-blue-500 hover:text-blue-700 font-semibold"
        >
          Register here
        </button>
      </div>
    </div>
  )
}

export default Login
