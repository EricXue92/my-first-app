import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function OAuthCallbackPage() {
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const setToken = useAuthStore((s) => s.setToken)
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const errorMsg = params.get('error')

    // Clear sensitive token from URL
    window.history.replaceState({}, '', '/oauth-callback')

    if (errorMsg) {
      setError(decodeURIComponent(errorMsg))
      return
    }

    if (token) {
      setToken(token)
      fetchMe()
        .then(() => navigate('/', { replace: true }))
        .catch(() => setError('登录失败，请重试'))
    } else {
      setError('登录失败，请重试')
    }
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-sm px-10 py-12 text-center"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        {error ? (
          <>
            <p
              className="font-cormorant text-4xl tracking-widest mb-6"
              style={{ color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.2em' }}
            >
              TASKS
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--brick)' }}>
              {error}
            </p>
            <Link
              to="/login"
              className="text-xs uppercase tracking-widest"
              style={{ color: 'var(--gold)', letterSpacing: '0.15em' }}
            >
              返回登录
            </Link>
          </>
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            登录中...
          </p>
        )}
      </div>
    </div>
  )
}
