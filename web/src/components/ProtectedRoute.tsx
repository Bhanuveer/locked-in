import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'

export function ProtectedRoute({
  children,
  role,
}: {
  children: ReactNode
  role?: 'student' | 'teacher' | 'parent'
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
