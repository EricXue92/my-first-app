import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ForgotPasswordPage() {
  const { sendResetCode, resetPassword } = useAuthStore()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('密码至少需要6个字符'); return }
    if (password !== confirmPassword) { setError('两次输入的密码不一致'); return }
    setLoading(true)
    try {
      await sendResetCode(email)
      setStep(2)
      setCountdown(60)
    } catch (err: any) {
      setError(err.response?.data?.detail || '发送失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setError('')
    setLoading(true)
    try {
      await sendResetCode(email)
      setCountdown(60)
    } catch (err: any) {
      setError(err.response?.data?.detail || '发送失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (code.length !== 6) { setError('请输入6位验证码'); return }
    setLoading(true)
    try {
      await resetPassword(email, code, password)
      navigate('/login', { state: { resetSuccess: true } })
    } catch (err: any) {
      setError(err.response?.data?.detail || '重置失败，请重试')
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
            重置密码
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-7">
            <input type="email" className="input-underline" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="注册邮箱" required />
            <input type="password" className="input-underline" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="新密码（至少6位）" required />
            <input type="password" className="input-underline" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="确认新密码" required />

            {error && <p className="text-xs" style={{ color: 'var(--brick)' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm tracking-widest uppercase font-medium transition-opacity disabled:opacity-40"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--bg)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.15em' }}
            >
              {loading ? '发送中...' : '发送验证码'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-7">
            <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
              验证码已发送至{' '}
              <span style={{ color: 'var(--gold)' }}>{email}</span>
            </p>

            <input
              className="input-underline text-center text-2xl tracking-[0.5em] font-cormorant"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="——————"
              required
              maxLength={6}
            />

            {error && <p className="text-xs" style={{ color: 'var(--brick)' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm tracking-widest uppercase font-medium transition-opacity disabled:opacity-40"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--bg)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.15em' }}
            >
              {loading ? '重置中...' : '重置密码'}
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setCode('') }}
                className="text-xs uppercase tracking-widest transition-colors"
                style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cream)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                修改信息
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="text-xs uppercase tracking-widest transition-colors disabled:opacity-30"
                style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: countdown > 0 ? 'not-allowed' : 'pointer' }}
              >
                {countdown > 0 ? `重发 (${countdown}s)` : '重新发送'}
              </button>
            </div>
          </form>
        )}

        <p className="text-xs text-center mt-8" style={{ color: 'var(--muted)' }}>
          已想起密码？{' '}
          <Link to="/login" style={{ color: 'var(--gold)' }}>登录</Link>
        </p>
      </div>
    </div>
  )
}
