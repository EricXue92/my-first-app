import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-sm px-10 py-12"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="mb-10 text-center">
          <p
            className="font-cormorant text-4xl tracking-widest mb-2"
            style={{ color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.2em' }}
          >
            TASKS
          </p>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.15em' }}>
            登录你的账号
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div>
            <input
              className="input-underline"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名"
              required
            />
          </div>
          <div>
            <input
              type="password"
              className="input-underline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              required
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--brick)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm tracking-widest uppercase font-medium transition-opacity disabled:opacity-40"
            style={{
              backgroundColor: 'var(--gold)',
              color: 'var(--bg)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.15em',
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-xs text-center mt-8" style={{ color: 'var(--muted)' }}>
          还没有账号？{' '}
          <Link to="/register" className="transition-colors" style={{ color: 'var(--gold)' }}>
            注册
          </Link>
        </p>
      </div>
    </div>
  )
}
