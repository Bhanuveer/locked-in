import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const NAV_LINKS: Record<string, { to: string; label: string }[]> = {
  student: [
    { to: '/student', label: 'Dashboard' },
    { to: '/student/quizzes', label: 'Quizzes' },
    { to: '/student/homework', label: 'Homework' },
    { to: '/student/attendance', label: 'Attendance' },
  ],
  teacher: [
    { to: '/teacher', label: 'Dashboard' },
    { to: '/teacher/quizzes', label: 'Quizzes' },
    { to: '/teacher/progress', label: 'Progress' },
    { to: '/teacher/attendance', label: 'Attendance' },
  ],
  parent: [
    { to: '/parent', label: 'Dashboard' },
    { to: '/parent/attendance', label: 'Attendance' },
  ],
}

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const links = user ? NAV_LINKS[user.role] ?? [] : []

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-wrap gap-3">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-lg font-semibold text-indigo-600">
          Locked in
        </Link>
        {links.length > 0 && (
          <div className="flex items-center gap-1 text-sm">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-2.5 py-1.5 rounded-md ${
                  location.pathname === link.to
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
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
