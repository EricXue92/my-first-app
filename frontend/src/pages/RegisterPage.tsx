import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function RegisterPage() {
  const { sendCode, register } = useAuthStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
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
    if (form.username.length < 3) { setError('用户名至少需要3个字符'); return }
    if (form.password.length < 6) { setError('密码至少需要6个字符'); return }
    if (form.password !== form.confirmPassword) { setError('两次输入的密码不一致'); return }
    setLoading(true)
    try {
      await sendCode(form.email)
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
      await sendCode(form.email)
      setCountdown(60)
    } catch (err: any) {
      setError(err.response?.data?.detail || '发送失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (code.length !== 6) { setError('请输入6位验证码'); return }
    setLoading(true)
    try {
      await register(form.username, form.email, form.password, code)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-sm">
        <h1 className="text-white text-2xl font-bold mb-6 text-center">创建账号</h1>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="用户名（至少3位）"
              required
              className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="邮箱"
              required
              className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="密码（至少6位）"
              required
              className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
            />
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="确认密码"
              required
              className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded py-2 transition"
            >
              {loading ? '发送中...' : '发送验证码'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <p className="text-gray-400 text-sm text-center">
              验证码已发送至 <span className="text-blue-400">{form.email}</span>
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="请输入6位验证码"
              required
              maxLength={6}
              className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-400 tracking-widest text-center text-lg"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded py-2 transition"
            >
              {loading ? '注册中...' : '完成注册'}
            </button>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setCode('') }}
                className="text-gray-400 hover:text-white text-sm transition"
              >
                修改信息
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="text-blue-400 hover:text-blue-300 disabled:text-gray-500 text-sm transition"
              >
                {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送'}
              </button>
            </div>
          </form>
        )}

        <p className="text-white/50 text-sm text-center mt-4">
          已有账号？{' '}
          <Link to="/login" className="text-blue-400 hover:underline">登录</Link>
        </p>
      </div>
    </div>
  )
}
