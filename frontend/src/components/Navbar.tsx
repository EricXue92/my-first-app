import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav
      style={{
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
      className="px-8 py-4 flex items-center justify-between"
    >
      <span
        className="font-cormorant text-xl tracking-widest"
        style={{ color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.15em' }}
      >
        TASKS
      </span>
      <div className="flex items-center gap-6">
        {user && (
          <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
            {user.username}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="text-xs tracking-widest uppercase transition-colors"
          style={{ color: 'var(--muted)', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cream)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}

        >
          退出
        </button>
      </div>
    </nav>
  )
}
