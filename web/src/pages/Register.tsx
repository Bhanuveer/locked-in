import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { AuthShell } from '../components/AuthShell'

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'parent', label: 'Parent' },
]

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await register(username, email, password, role)
      navigate(`/${user.role}`)
    } catch (err: any) {
      const detail = err?.response?.data
      setError(detail ? JSON.stringify(detail) : 'Registration failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Start a session that actually proves you studied.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">I am a...</label>
          <div className="flex gap-2">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`flex-1 py-2 rounded-md text-sm border transition ${
                  role === r.value
                    ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white border-transparent'
                    : 'border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Username</label>
          <input
            className="w-full bg-slate-950/60 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Email</label>
          <input
            type="email"
            className="w-full bg-slate-950/60 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Password</label>
          <input
            type="password"
            className="w-full bg-slate-950/60 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        {error && <p className="text-sm text-red-400 break-words">{error}</p>}
        <button
          disabled={busy}
          className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-md py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="text-sm text-slate-400 mt-5 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 font-medium hover:text-indigo-300">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
