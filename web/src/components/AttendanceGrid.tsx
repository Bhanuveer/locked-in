import { useQuery } from '@tanstack/react-query'
import { api, type Attendance } from '../lib/api'

function cellColor(day: Attendance['days'][number]) {
  if (day.completed_count > 0 && day.quiz_taken) return 'bg-indigo-600'
  if (day.completed_count > 0 || day.quiz_taken) return 'bg-indigo-400'
  if (day.session_count > 0) return 'bg-indigo-200'
  return 'bg-slate-100'
}

export function AttendanceGrid({ studentId }: { studentId?: number }) {
  const { data } = useQuery({
    queryKey: ['attendance', studentId],
    queryFn: async () =>
      (await api.get<Attendance>('/attendance/', { params: studentId ? { student: studentId } : {} })).data,
  })

  if (!data) return <p className="text-sm text-slate-400">Loading attendance...</p>

  return (
    <div>
      <div className="flex gap-6 mb-4">
        <div>
          <p className="text-2xl font-bold text-slate-800">{data.streak_days}</p>
          <p className="text-xs text-slate-500">day streak</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{data.points}</p>
          <p className="text-xs text-slate-500">total points</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">
            {data.days.filter((d) => d.session_count > 0 || d.quiz_taken).length}
          </p>
          <p className="text-xs text-slate-500">active days (last 30)</p>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {data.days.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.session_count} session(s), quiz: ${d.quiz_taken ? 'yes' : 'no'}`}
            className={`aspect-square rounded ${cellColor(d)}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-100 inline-block" /> No activity
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-indigo-200 inline-block" /> Started
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-indigo-400 inline-block" /> Completed session or quiz
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> Both
        </span>
      </div>
    </div>
  )
}
