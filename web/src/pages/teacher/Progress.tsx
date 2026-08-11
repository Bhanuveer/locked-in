import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, type StudySession } from '../../lib/api'

function accuracy(s: StudySession) {
  if (s.questions_asked === 0) return null
  return Math.round((s.questions_correct / s.questions_asked) * 100)
}

function weekKey(dateStr: string) {
  const d = new Date(dateStr)
  const firstDayOfYear = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - firstDayOfYear.getTime()) / 86400000 + firstDayOfYear.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

export function TeacherProgress() {
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => (await api.get<StudySession[]>('/sessions/')).data,
  })

  const perStudent = useMemo(() => {
    if (!sessions) return []
    const grouped: Record<string, number[]> = {}
    for (const s of sessions) {
      const acc = accuracy(s)
      if (acc === null) continue
      grouped[s.student_username] = grouped[s.student_username] || []
      grouped[s.student_username].push(acc)
    }
    return Object.entries(grouped).map(([student, accs]) => ({
      student,
      avgAccuracy: Math.round(accs.reduce((a, b) => a + b, 0) / accs.length),
      sessions: accs.length,
    }))
  }, [sessions])

  const weeklyTrend = useMemo(() => {
    if (!sessions) return []
    const grouped: Record<string, number[]> = {}
    for (const s of sessions) {
      const acc = accuracy(s)
      if (acc === null) continue
      const key = weekKey(s.started_at)
      grouped[key] = grouped[key] || []
      grouped[key].push(acc)
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, accs]) => ({
        week,
        avgAccuracy: Math.round(accs.reduce((a, b) => a + b, 0) / accs.length),
      }))
  }, [sessions])

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-lg font-semibold text-slate-800">Class progress</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-medium text-slate-600 mb-4">Average accuracy per student</h2>
        {perStudent.length === 0 ? (
          <p className="text-sm text-slate-400">No answered questions yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={perStudent}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="student" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="avgAccuracy" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-medium text-slate-600 mb-4">Class accuracy trend over time</h2>
        {weeklyTrend.length === 0 ? (
          <p className="text-sm text-slate-400">Not enough data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Line type="monotone" dataKey="avgAccuracy" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
