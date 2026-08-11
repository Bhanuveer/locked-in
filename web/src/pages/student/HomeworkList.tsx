import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, type Homework } from '../../lib/api'

export function StudentHomeworkList() {
  const { data: homework, isLoading } = useQuery({
    queryKey: ['homework'],
    queryFn: async () => (await api.get<Homework[]>('/homework/')).data,
  })

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-lg font-semibold text-slate-800 mb-1">Homework</h1>
      <p className="text-sm text-slate-500 mb-4">
        Open the AI assistant for any homework — it only answers using exactly what was taught for that topic.
      </p>
      {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {homework?.length === 0 && <p className="text-sm text-slate-400">No homework assigned yet.</p>}
      <div className="space-y-2">
        {homework?.map((h) => (
          <div key={h.id} className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{h.title}</p>
              <p className="text-xs text-slate-500">
                {h.classroom_name} · Topic: {h.topic}
                {h.due_date ? ` · Due ${h.due_date}` : ''}
              </p>
            </div>
            <Link
              to={`/student/homework/${h.id}`}
              className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white text-sm rounded-md px-3 py-1.5 font-medium hover:opacity-90 transition"
            >
              Ask AI assistant
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
