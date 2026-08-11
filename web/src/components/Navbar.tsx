import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      <Link to="/" className="text-lg font-semibold text-indigo-600">
        StudyBuddy
      </Link>
      {user && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500">
            {user.username} <span className="capitalize text-indigo-500">({user.role})</span>
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  )
}
