import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Homework, type ParentLink, type StudySession } from '../../lib/api'

export function ParentDashboard() {
  const queryClient = useQueryClient()
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  const { data: children } = useQuery({
    queryKey: ['children'],
    queryFn: async () => (await api.get<ParentLink[]>('/auth/parent/children/')).data,
  })
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => (await api.get<StudySession[]>('/sessions/')).data,
  })
  const { data: homework } = useQuery({
    queryKey: ['homework'],
    queryFn: async () => (await api.get<Homework[]>('/homework/')).data,
  })

  const linkChild = useMutation({
    mutationFn: async () => (await api.post('/auth/parent/link-request/', { invite_code: inviteCode })).data,
    onSuccess: () => {
      setInviteCode('')
      setError('')
      queryClient.invalidateQueries({ queryKey: ['children'] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['homework'] })
    },
    onError: () => setError('Invalid invite code — ask your student for their code from their dashboard.'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (inviteCode.trim()) linkChild.mutate()
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">👨‍👩‍👧 Linked children</h2>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
            placeholder="Student's invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
          <button
            disabled={linkChild.isPending}
            className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Link
          </button>
        </form>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <div className="flex flex-wrap gap-2">
          {children?.map((c) => (
            <span key={c.id} className="text-sm bg-indigo-50 text-indigo-700 rounded-full px-3 py-1">
              {c.student_username}
            </span>
          ))}
          {children?.length === 0 && (
            <p className="text-sm text-slate-400">No linked children yet — ask your student for their invite code.</p>
          )}
        </div>
      </div>

      {sessions?.some((s) => s.status === 'abandoned' && s.abandon_reason) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-1">Parental Mode alerts</h2>
          <p className="text-xs text-amber-700 mb-4">Reasons your child logged for stopping a session early.</p>
          <div className="space-y-2">
            {sessions
              .filter((s) => s.status === 'abandoned' && s.abandon_reason)
              .map((s) => (
                <div key={s.id} className="bg-white border border-amber-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-800">
                    {s.student_username} — {s.subject}/{s.topic}
                  </p>
                  <p className="text-xs text-slate-500 mb-1">{new Date(s.started_at).toLocaleDateString()}</p>
                  <p className="text-sm text-amber-800">"{s.abandon_reason}"</p>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">📅 Session history</h2>
        <div className="space-y-2">
          {sessions?.map((s) => (
            <div key={s.id} className="border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {s.student_username} — {s.subject}/{s.topic}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(s.started_at).toLocaleDateString()} · {s.status} · {s.actual_duration_minutes ?? '-'} min
                </p>
              </div>
              <p className="text-sm text-slate-600">
                {s.questions_correct}/{s.questions_asked} correct
              </p>
            </div>
          ))}
          {sessions?.length === 0 && <p className="text-sm text-slate-400">No sessions yet.</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">📝 Homework status</h2>
        <div className="space-y-2">
          {homework?.map((h) => (
            <div key={h.id} className="border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition p-3">
              <p className="text-sm font-medium text-slate-800">{h.title}</p>
              <p className="text-xs text-slate-500">
                {h.classroom_name} · Topic: {h.topic}
                {h.due_date ? ` · Due ${h.due_date}` : ''}
              </p>
            </div>
          ))}
          {homework?.length === 0 && <p className="text-sm text-slate-400">No homework assigned yet.</p>}
        </div>
      </div>
    </div>
  )
}
