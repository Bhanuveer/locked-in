import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { AuthShell } from '../components/AuthShell'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await login(username, password)
      navigate(`/${user.role}`)
    } catch {
      setError('Invalid username or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your streak.">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm text-slate-300 mb-1">Password</label>
          <input
            type="password"
            className="w-full bg-slate-950/60 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          disabled={busy}
          className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-md py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {busy ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="text-sm text-slate-400 mt-5 text-center">
        No account?{' '}
        <Link to="/register" className="text-indigo-400 font-medium hover:text-indigo-300">
          Register
        </Link>
      </p>
    </AuthShell>
  )
}
