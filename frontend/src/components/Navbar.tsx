import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
      <span className="font-bold text-lg">✅ TodoApp</span>
      <div className="flex items-center gap-4 text-sm">
        {user && <span className="opacity-70">你好，{user.username}</span>}
        <button
          onClick={handleLogout}
          className="border border-white/30 px-3 py-1 rounded hover:bg-white/10 transition"
        >
          退出
        </button>
      </div>
    </nav>
  )
}
