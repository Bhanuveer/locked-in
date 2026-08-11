import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-0"
        style={{
          background:
            'radial-gradient(500px circle at 15% 10%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(450px circle at 90% 90%, rgba(192,38,211,0.2), transparent 60%)',
        }}
      />
      <div className="relative w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-xl font-semibold bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
            Locked in
          </span>
        </Link>
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h1 className="text-xl font-semibold text-white mb-1">{title}</h1>
          <p className="text-sm text-slate-400 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
