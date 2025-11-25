/**
 * Login Component - React example with token expiration
 * 
 * Features:
 * - Login form (email + password)
 * - Remember me checkbox (long-lived token)
 * - Device name auto-detect
 * - Token storage (sessionStorage + localStorage)
 * - Error handling
 * 
 * Token Management:
 * - sessionStorage: Current session token (cleared on browser close)
 * - localStorage: Remember token (persistent, survive browser restart)
 * 
 * On Success:
 * - Store token
 * - Store user info
 * - Redirect to dashboard
 * 
 * On 401:
 * - Axios interceptor auto-refresh
 * - Retry login
 * - If refresh fail → redirect to login again
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '@/lib/api'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ========== Handle Submit ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Call login helper
      const result = await login(email, password, rememberMe)

      if (result.success) {
        // Login success → redirect to dashboard
        navigate('/dashboard')
      } else {
        setError('Email hoặc mật khẩu không đúng.')
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng nhập. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Đăng nhập</h1>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="form-control"
              placeholder="your@email.com"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="form-control"
              placeholder="••••••••"
            />
          </div>

          {/* Remember Me */}
          <div className="form-check">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
              className="form-check-input"
            />
            <label className="form-check-label" htmlFor="rememberMe">
              Ghi nhớ tôi (30 ngày) - Dùng long-lived token
            </label>
          </div>

          {/* Info: Remember Me = Long-lived Token */}
          <div className="alert alert-info mt-3">
            <strong>Lưu ý:</strong>
            <ul>
              <li>
                <strong>Không check "Ghi nhớ tôi":</strong> Token hết hạn trong 1 giờ (bảo mật cao)
              </li>
              <li>
                <strong>Check "Ghi nhớ tôi":</strong> Token hết hạn trong 30 ngày (tiện lợi)
              </li>
              <li>Token hết hạn → Tự động refresh → Tiếp tục sử dụng</li>
              <li>Token bị logout → Phải login lại</li>
            </ul>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>
            Chưa có tài khoản? <a href="/register">Đăng ký</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
