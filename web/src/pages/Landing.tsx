import { Link } from 'react-router-dom'

const FEATURES = [
  {
    emoji: '🧠',
    title: 'AI comprehension checks',
    body: 'Mid-session, the AI asks a real question about what you\'re studying and grades your answer — not just a timer running in the background.',
  },
  {
    emoji: '🤖',
    title: 'Loco, your voice assistant',
    body: 'Say "Loco" and what you want to study — it starts the session for you. No typing, no menus.',
  },
  {
    emoji: '⌚',
    title: 'Wear OS companion',
    body: 'A live watch companion mirrors your session — vibration alerts, question prompts, and results right on your wrist.',
  },
  {
    emoji: '📝',
    title: 'Auto-generated quizzes',
    body: 'Teachers generate 15–20 question quizzes straight from what was taught — AI writes them, grades them instantly.',
  },
  {
    emoji: '👨‍👩‍👧',
    title: 'Real visibility for parents',
    body: 'Session history, homework status, and honest reasons when a session gets cut short — sent straight to Parental Mode.',
  },
  {
    emoji: '🔥',
    title: 'Streaks & rewards',
    body: 'Points, streaks, and a dashboard that visually upgrades the more consistently you show up.',
  },
]

const STEPS = [
  { n: '1', title: 'Start a session', body: 'Pick a subject and topic, or just tell Loco what you\'re studying.' },
  { n: '2', title: 'AI checks you\'re really studying', body: 'Mid-session questions verify real understanding, not just time on a timer.' },
  { n: '3', title: 'Parents & teachers see the real picture', body: 'Accuracy, streaks, and honest session history — no guessing.' },
]

export function Landing() {
  return (
    <div className="bg-slate-950 text-white">
      <div
        className="absolute inset-x-0 top-0 h-[600px] -z-10 opacity-40"
        style={{
          background:
            'radial-gradient(600px circle at 20% 0%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(500px circle at 85% 10%, rgba(192,38,211,0.3), transparent 60%)',
        }}
      />

      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
          Locked in
        </span>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-slate-300 hover:text-white px-3 py-1.5">
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm bg-white text-slate-900 rounded-md px-4 py-1.5 font-medium hover:bg-slate-100"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="pt-16 pb-20 text-center">
          <span className="inline-block text-xs font-medium tracking-wide uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-1 mb-6">
            AI-powered study accountability
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6">
            Prove you were
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              actually studying.
            </span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
            Not another timer app. Locked in quizzes you mid-session, verifies real understanding with AI, and gives
            parents and teachers an honest picture of what happened — not just how long a screen was open.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-lg px-6 py-3 font-medium hover:opacity-90 transition"
            >
              Start studying free
            </Link>
            <Link
              to="/login"
              className="border border-slate-600 text-slate-200 rounded-lg px-6 py-3 font-medium hover:bg-slate-800 transition"
            >
              I have an account
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-20">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-sm font-semibold mb-4">
                {s.n}
              </span>
              <h3 className="font-semibold mb-1.5">{s.title}</h3>
              <p className="text-sm text-slate-400">{s.body}</p>
            </div>
          ))}
        </section>

        <section className="pb-24">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-2">Everything the pitch needs</h2>
          <p className="text-slate-400 text-center mb-12">Built and working end-to-end, not slides.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition"
              >
                <span className="text-2xl">{f.emoji}</span>
                <h3 className="font-semibold mt-3 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-24">
          <div className="bg-gradient-to-r from-indigo-600/20 to-fuchsia-600/20 border border-indigo-500/30 rounded-2xl p-10 text-center">
            <h2 className="text-2xl font-semibold mb-3">Three roles, one honest picture</h2>
            <p className="text-slate-300 max-w-xl mx-auto mb-8">
              Students study and get verified. Teachers assign homework and see real results. Parents get visibility
              without needing to ask.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
              <div className="bg-slate-950/40 rounded-lg p-4">
                <p className="text-sm font-medium text-indigo-300 mb-1">Student</p>
                <p className="text-xs text-slate-400">Study sessions, AI quizzes, voice assistant, streaks.</p>
              </div>
              <div className="bg-slate-950/40 rounded-lg p-4">
                <p className="text-sm font-medium text-indigo-300 mb-1">Teacher</p>
                <p className="text-xs text-slate-400">Classes, homework, auto-quizzes, progress charts.</p>
              </div>
              <div className="bg-slate-950/40 rounded-lg p-4">
                <p className="text-sm font-medium text-indigo-300 mb-1">Parent</p>
                <p className="text-xs text-slate-400">Session history, attendance, Parental Mode alerts.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        Locked in — built as a working prototype, not a mockup.
      </footer>
    </div>
  )
}
