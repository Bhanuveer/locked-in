import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type StudySession } from '../../lib/api'

const AUTO_QUESTION_INTERVAL_SECONDS = 40

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function SessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [answer, setAnswer] = useState('')
  const [now, setNow] = useState(Date.now())

  const { data: session } = useQuery({
    queryKey: ['session', id],
    queryFn: async () => (await api.get<StudySession>(`/sessions/${id}/`)).data,
    refetchInterval: 4000,
  })

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const elapsedSeconds = session ? Math.floor((now - new Date(session.started_at).getTime()) / 1000) : 0

  const pendingQuestion = session?.questions.find((q) => q.is_correct === null)

  const generateQuestion = useMutation({
    mutationFn: async () => (await api.post(`/sessions/${id}/questions/generate/`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session', id] }),
  })

  const answerQuestion = useMutation({
    mutationFn: async (qid: number) =>
      (await api.post(`/sessions/${id}/questions/${qid}/answer/`, { answer })).data,
    onSuccess: () => {
      setAnswer('')
      queryClient.invalidateQueries({ queryKey: ['session', id] })
    },
  })

  const endSession = useMutation({
    mutationFn: async (completed: boolean) =>
      (await api.post(`/sessions/${id}/end/`, { completed })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['session', id] })
    },
  })

  const lastQuestionAt = useMemo(() => {
    if (!session || session.questions.length === 0) return session ? new Date(session.started_at).getTime() : 0
    return new Date(session.questions[session.questions.length - 1].asked_at).getTime()
  }, [session])

  useEffect(() => {
    if (!session || session.status !== 'in_progress') return
    if (pendingQuestion) return
    if (generateQuestion.isPending) return
    const secondsSinceLast = (now - lastQuestionAt) / 1000
    if (secondsSinceLast >= AUTO_QUESTION_INTERVAL_SECONDS) {
      generateQuestion.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, session?.status, pendingQuestion, lastQuestionAt])

  if (!session) {
    return <div className="p-8 text-center text-slate-400">Loading session...</div>
  }

  if (session.status !== 'in_progress') {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-xl border border-slate-200 text-center">
        <h1 className="text-xl font-semibold text-slate-800 mb-2">
          Session {session.status === 'completed' ? 'complete' : 'abandoned'}
        </h1>
        <p className="text-slate-500 mb-6">
          {session.subject} — {session.topic}
        </p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-2xl font-semibold text-slate-800">{session.actual_duration_minutes}</p>
            <p className="text-xs text-slate-500">minutes studied</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-2xl font-semibold text-slate-800">{session.questions_asked}</p>
            <p className="text-xs text-slate-500">questions asked</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-2xl font-semibold text-emerald-600">{session.questions_correct}</p>
            <p className="text-xs text-slate-500">answered correctly</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/student')}
          className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-500 mb-1">
          {session.subject} — {session.topic}
        </p>
        <p className="text-4xl font-semibold text-slate-800 tabular-nums">{formatDuration(elapsedSeconds)}</p>
        <p className="text-xs text-slate-400 mt-1">planned: {session.planned_duration_minutes} min</p>
        <div className="flex justify-center gap-3 mt-5">
          <button
            onClick={() => endSession.mutate(true)}
            disabled={endSession.isPending}
            className="bg-emerald-600 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            End session
          </button>
          <button
            onClick={() => endSession.mutate(false)}
            disabled={endSession.isPending}
            className="border border-slate-300 text-slate-600 rounded-md px-4 py-2 text-sm disabled:opacity-50"
          >
            Abandon
          </button>
        </div>
      </div>

      {pendingQuestion ? (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-2">AI comprehension check</p>
          <p className="text-slate-800 font-medium mb-4">{pendingQuestion.question_text}</p>
          <textarea
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mb-3"
            rows={3}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
          />
          <button
            onClick={() => answerQuestion.mutate(pendingQuestion.id)}
            disabled={answerQuestion.isPending || !answer.trim()}
            className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {answerQuestion.isPending ? 'Checking...' : 'Submit answer'}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-500 mb-3">
            The AI will ask a topic question automatically (sped up for this demo, roughly every{' '}
            {AUTO_QUESTION_INTERVAL_SECONDS}s of study).
          </p>
          <button
            onClick={() => generateQuestion.mutate()}
            disabled={generateQuestion.isPending}
            className="border border-indigo-300 text-indigo-600 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {generateQuestion.isPending ? 'Thinking...' : 'Ask me a question now'}
          </button>
        </div>
      )}

      {session.questions.filter((q) => q.is_correct !== null).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-600">Answered so far</h3>
          {session.questions
            .filter((q) => q.is_correct !== null)
            .slice()
            .reverse()
            .map((q) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 font-medium mb-1">{q.question_text}</p>
                <p className="text-sm text-slate-500 mb-1">Your answer: {q.student_answer}</p>
                <p className={`text-sm ${q.is_correct ? 'text-emerald-600' : 'text-red-500'}`}>
                  {q.is_correct ? '✓ Correct' : '✗ Needs work'} — {q.ai_feedback}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
