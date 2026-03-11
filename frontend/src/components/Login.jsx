import { useState } from 'react'

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [registerError, setRegisterError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }
      const data = await response.json()
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLoginSuccess(data.user, data.access_token)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegisterError('')
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }
      const data = await response.json()
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLoginSuccess(data.user, data.access_token)
    } catch (err) {
      setRegisterError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Re-usable input style ──
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#182030',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#E4E8F5',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit'
  }

  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#9AA3BF', marginBottom: 8
  }

  return (
    <div style={{
      height: '100vh',
      background: '#080B13',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, position: 'relative', overflow: 'hidden'
    }}>
      {/* Background orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'rgba(13,17,32,0.9)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '40px 32px',
        position: 'relative', zIndex: 1
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #52B7FF, #9B6FFF)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
            boxShadow: '0 0 30px rgba(82,183,255,0.3)'
          }}></div>
          <h1 className="font-brand" style={{
            fontSize: 28, fontWeight: 800, color: '#E4E8F5', letterSpacing: -0.5
          }}>
            ARI<span style={{ color: '#52B7FF' }}>A</span>
          </h1>
          <p style={{ color: '#5A6280', fontSize: 13, marginTop: 4 }}>
            AI-powered assistant
          </p>
        </div>

        {!showRegister ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{
                background: 'rgba(255,126,95,0.1)', border: '1px solid rgba(255,126,95,0.25)',
                color: '#FF7E5F', padding: '10px 14px', borderRadius: 10, fontSize: 13
              }}>{error}</div>
            )}

            <div>
              <label style={labelStyle}>Username</label>
              <input
                type="text" value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={inputStyle}
                disabled={isLoading}
                onFocus={e => { e.target.style.borderColor = 'rgba(82,183,255,0.4)'; e.target.style.boxShadow = '0 0 12px rgba(82,183,255,0.1)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={inputStyle}
                disabled={isLoading}
                onFocus={e => { e.target.style.borderColor = 'rgba(82,183,255,0.4)'; e.target.style.boxShadow = '0 0 12px rgba(82,183,255,0.1)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              style={{
                width: '100%', padding: '12px 0', marginTop: 8,
                background: 'linear-gradient(135deg, #52B7FF, #9B6FFF)',
                border: 'none', borderRadius: 10,
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: isLoading || !username || !password ? 'not-allowed' : 'pointer',
                opacity: isLoading || !username || !password ? 0.5 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 0 20px rgba(82,183,255,0.25)',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {isLoading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>

            <p style={{ textAlign: 'center', color: '#5A6280', fontSize: 13, marginTop: 8 }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setShowRegister(true); setError('') }}
                style={{ background: 'none', border: 'none', color: '#52B7FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >Sign up</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {registerError && (
              <div style={{
                background: 'rgba(255,126,95,0.1)', border: '1px solid rgba(255,126,95,0.25)',
                color: '#FF7E5F', padding: '10px 14px', borderRadius: 10, fontSize: 13
              }}>{registerError}</div>
            )}

            <div>
              <label style={labelStyle}>Username</label>
              <input
                type="text" value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                style={inputStyle} disabled={isLoading}
                onFocus={e => { e.target.style.borderColor = 'rgba(82,183,255,0.4)'; e.target.style.boxShadow = '0 0 12px rgba(82,183,255,0.1)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={inputStyle} disabled={isLoading}
                onFocus={e => { e.target.style.borderColor = 'rgba(82,183,255,0.4)'; e.target.style.boxShadow = '0 0 12px rgba(82,183,255,0.1)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (8+ characters)"
                style={inputStyle} disabled={isLoading}
                onFocus={e => { e.target.style.borderColor = 'rgba(82,183,255,0.4)'; e.target.style.boxShadow = '0 0 12px rgba(82,183,255,0.1)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !email || !password}
              style={{
                width: '100%', padding: '12px 0', marginTop: 8,
                background: 'linear-gradient(135deg, #52B7FF, #9B6FFF)',
                border: 'none', borderRadius: 10,
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: isLoading || !username || !email || !password ? 'not-allowed' : 'pointer',
                opacity: isLoading || !username || !email || !password ? 0.5 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 0 20px rgba(82,183,255,0.25)',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {isLoading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />
                  Creating account…
                </>
              ) : 'Create Account'}
            </button>

            <p style={{ textAlign: 'center', color: '#5A6280', fontSize: 13, marginTop: 8 }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setShowRegister(false); setRegisterError('') }}
                style={{ background: 'none', border: 'none', color: '#52B7FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >Sign in</button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
