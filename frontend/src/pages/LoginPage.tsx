import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

const GitHubIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
)

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  fontSize: '0.9rem',
  fontFamily: 'DM Sans, sans-serif',
  backgroundColor: 'var(--surface-2)',
  border: '1.5px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--cream)',
  outline: 'none',
  transition: 'border-color 0.18s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 500,
  color: 'var(--muted)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  marginBottom: '0.45rem',
}

const oauthBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.6rem',
  width: '100%',
  padding: '0.625rem',
  fontSize: '0.85rem',
  fontFamily: 'DM Sans, sans-serif',
  fontWeight: 500,
  color: 'var(--cream)',
  backgroundColor: 'var(--surface)',
  border: '1.5px solid var(--border)',
  borderRadius: '8px',
  textDecoration: 'none',
  transition: 'background-color 0.18s, border-color 0.18s',
  cursor: 'pointer',
}

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success] = useState(location.state?.resetSuccess ? '密码重置成功，请重新登录' : '')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (location.state?.resetSuccess) {
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-card { animation: loginFadeUp 0.4s ease both; }
        .oauth-btn:hover { background-color: var(--surface-2) !important; border-color: rgba(0,0,0,0.14) !important; }
        .login-input:focus { border-color: var(--gold) !important; }
        .submit-btn:not(:disabled):hover { opacity: 0.88 !important; }
        .submit-btn:not(:disabled):active { transform: scale(0.99); }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        {/* Soft radial glow */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(ellipse 60% 50% at 15% 15%, rgba(11,158,150,0.07) 0%, transparent 70%),' +
            'radial-gradient(ellipse 50% 40% at 85% 85%, rgba(11,158,150,0.05) 0%, transparent 70%)',
        }} />

        <div className="login-card" style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontFamily: 'Cormorant SC, serif',
              fontSize: '2.4rem',
              fontWeight: 600,
              color: 'var(--gold)',
              letterSpacing: '0.28em',
              margin: 0,
              lineHeight: 1,
            }}>
              TASKS
            </h1>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.78rem',
              color: 'var(--muted)',
              marginTop: '0.5rem',
              letterSpacing: '0.05em',
            }}>
              欢迎回来
            </p>
          </div>

          {/* Card */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '2.25rem 2rem',
            boxShadow: '0 2px 20px rgba(0,0,0,0.05), 0 8px 40px rgba(0,0,0,0.04)',
          }}>
            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>用户名</label>
                <input
                  className="login-input"
                  style={inputStyle}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入你的用户名"
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.45rem' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>密码</label>
                  <Link
                    to="/forgot-password"
                    style={{ fontSize: '0.72rem', color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--gold)')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--muted)')}
                  >
                    忘记密码？
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="login-input"
                    style={{ ...inputStyle, paddingRight: '2.6rem' }}
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入你的密码"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--muted)', padding: 0, display: 'flex', alignItems: 'center',
                    }}
                    aria-label={showPass ? '隐藏密码' : '显示密码'}
                  >
                    <EyeIcon open={showPass} />
                  </button>
                </div>
              </div>

              {/* Feedback */}
              {success && (
                <p style={{ fontSize: '0.78rem', color: 'var(--gold)', margin: '0.5rem 0 0.75rem' }}>{success}</p>
              )}
              {error && (
                <p style={{ fontSize: '0.78rem', color: 'var(--brick)', margin: '0.5rem 0 0.75rem' }}>{error}</p>
              )}

              {/* Submit */}
              <button
                className="submit-btn"
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  padding: '0.7rem',
                  fontSize: '0.87rem',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  backgroundColor: 'var(--gold)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'opacity 0.18s, transform 0.1s',
                }}
              >
                {loading ? '登录中…' : '登录'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', margin: '1.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>或</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
            </div>

            {/* OAuth */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <a
                className="oauth-btn"
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/google`}
                style={oauthBtnStyle}
              >
                <GoogleIcon />
                使用 Google 登录
              </a>
              <a
                className="oauth-btn"
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/github`}
                style={oauthBtnStyle}
              >
                <GitHubIcon />
                使用 GitHub 登录
              </a>
            </div>

            {/* Register */}
            <p style={{
              textAlign: 'center',
              fontSize: '0.78rem',
              color: 'var(--muted)',
              marginTop: '1.5rem',
              marginBottom: 0,
            }}>
              还没有账号？{' '}
              <Link to="/register" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
                注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
