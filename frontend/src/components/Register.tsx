import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface RegisterProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

/**
 * Register Component - httpOnly Cookie Authentication
 *
 * Same security as Login:
 * - Token in httpOnly cookie (not localStorage)
 * - CSRF token in sessionStorage
 * - XSS cannot steal token
 */
const Register: React.FC<RegisterProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { registerHttpOnly, loading: authLoading, error: authError, clearError } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (error) setError(null)
    if (authError) clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      await registerHttpOnly(form.name, form.email, form.password, form.password_confirmation)

      setForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
      })
      onSuccess?.()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const errorMsg = error?.response?.data?.message || error?.message || 'Registration failed'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const isLoading = loading || authLoading
  const displayError = error || authError

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-green-600">Register</h2>

      {displayError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-500 rounded-lg text-red-700 text-sm">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full p-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full p-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
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
            className="w-full p-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
          <p className="text-xs text-gray-600 mt-1">At least 8 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            name="password_confirmation"
            value={form.password_confirmation}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full p-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-green-500 hover:text-green-700 font-semibold"
        >
          Login here
        </button>
      </div>
    </div>
  )
}

export default Register
