import { useState } from 'react'

const IconLayers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
)

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const endpoint = isRegister ? '/register' : '/login'
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.msg || 'Authentication failed')
      }

      if (isRegister) {
        // After register, auto-login
        const loginRes = await fetch('http://localhost:5000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password })
        })
        const loginData = await loginRes.json()
        if (!loginRes.ok) throw new Error(loginData.error || 'Login failed after registration')
        localStorage.setItem('auth_token', loginData.access_token)
        localStorage.setItem('user', JSON.stringify(loginData.user))
        onLoginSuccess(loginData.user, loginData.access_token)
      } else {
        localStorage.setItem('auth_token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onLoginSuccess(data.user, data.access_token)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card" style={{ animation: 'slideUp 0.25s ease' }}>
        <div className="login-brand">
          <div className="login-brand-icon"><IconLayers /></div>
          <div className="login-brand-name">ARIA</div>
          <div className="login-brand-sub">AI Research & Intelligence Assistant</div>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="field-label">Username</label>
            <input
              className="login-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
            />
          </div>
          <div className="login-field">
            <label className="field-label">Password</label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          {isRegister && (
            <div className="login-field">
              <label className="field-label">Confirm Password</label>
              <input
                className="login-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>
          )}
          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="login-switch">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            className="login-switch-btn"
            onClick={() => { setIsRegister(!isRegister); setError('') }}
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}