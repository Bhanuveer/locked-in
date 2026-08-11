import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api, type StudySession } from '../../lib/api'
import { useAuth } from '../../lib/auth'

export function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(30)
  const [error, setError] = useState('')

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => (await api.get<StudySession[]>('/sessions/')).data,
  })

  const startSession = useMutation({
    mutationFn: async () => {
      const res = await api.post<StudySession>('/sessions/start/', {
        subject,
        topic,
        planned_duration_minutes: duration,
      })
      return res.data
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate(`/student/session/${session.id}`)
    },
    onError: () => setError('Could not start session. Please fill in all fields.'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    startSession.mutate()
  }

  const activeSession = sessions?.find((s) => s.status === 'in_progress')

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {user && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-indigo-800">
            Share this invite code with your parent so they can link to your account:
          </span>
          <code className="bg-white border border-indigo-200 rounded-md px-3 py-1 text-sm font-mono text-indigo-700">
            {user.invite_code}
          </code>
        </div>
      )}
      {activeSession && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-amber-800">
            You have a session in progress: <strong>{activeSession.subject} — {activeSession.topic}</strong>
          </span>
          <button
            onClick={() => navigate(`/student/session/${activeSession.id}`)}
            className="bg-amber-600 text-white text-sm px-3 py-1.5 rounded-md"
          >
            Resume
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Start a study session</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Subject</label>
            <input
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Maths"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Topic</label>
            <input
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Quadratic Equations"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Duration (min)</label>
            <input
              type="number"
              min={5}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
            />
          </div>
          <div className="sm:col-span-3">
            {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
            <button
              disabled={startSession.isPending || !!activeSession}
              className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {activeSession ? 'Finish your current session first' : startSession.isPending ? 'Starting...' : 'Start session'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Past sessions</h2>
        {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
        {sessions && sessions.length === 0 && (
          <p className="text-sm text-slate-400">No sessions yet — start your first one above.</p>
        )}
        <div className="space-y-2">
          {sessions
            ?.filter((s) => s.status !== 'in_progress')
            .map((s) => (
              <div
                key={s.id}
                className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {s.subject} — {s.topic}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(s.started_at).toLocaleString()} · {s.actual_duration_minutes ?? 0} min ·{' '}
                    <span className={s.status === 'completed' ? 'text-emerald-600' : 'text-red-500'}>
                      {s.status}
                    </span>
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  {s.questions_correct}/{s.questions_asked} correct
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
