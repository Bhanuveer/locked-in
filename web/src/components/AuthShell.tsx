import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const HIGHLIGHTS = [
  { emoji: '🧠', text: 'AI questions you mid-session to verify real understanding' },
  { emoji: '🤖', text: 'Loco, a voice assistant that starts sessions hands-free' },
  { emoji: '⌚', text: 'A live watch companion mirroring your session' },
  { emoji: '👨‍👩‍👧', text: 'Honest visibility for parents and teachers' },
]

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        <div
          className="absolute inset-0 -z-0"
          style={{
            background:
              'radial-gradient(600px circle at 20% 20%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(500px circle at 80% 80%, rgba(192,38,211,0.3), transparent 60%)',
          }}
        />
        <Link to="/" className="relative flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white">
            🔒
          </span>
          <span className="text-xl font-semibold bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
            Locked in
          </span>
        </Link>

        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight mb-6">
            Prove you were
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              actually studying.
            </span>
          </h2>
          <div className="space-y-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.text} className="flex items-start gap-3">
                <span className="text-xl">{h.emoji}</span>
                <p className="text-sm text-slate-300 mt-0.5">{h.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">Locked in — built as a working prototype, not a mockup.</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <div
          className="absolute inset-0 -z-0 lg:hidden"
          style={{
            background:
              'radial-gradient(500px circle at 15% 10%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(450px circle at 90% 90%, rgba(192,38,211,0.2), transparent 60%)',
          }}
        />
        <div className="relative w-full max-w-sm">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8 lg:hidden">
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
    </div>
  )
}
