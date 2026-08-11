import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, type Quiz } from '../../lib/api'

export function StudentQuizzes() {
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => (await api.get<Quiz[]>('/quizzes/')).data,
  })

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-lg font-semibold text-slate-800 mb-4">Quizzes</h1>
      {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {quizzes?.length === 0 && (
        <p className="text-sm text-slate-400">No quizzes yet — your teacher hasn't generated one.</p>
      )}
      <div className="space-y-2">
        {quizzes?.map((q) => (
          <div key={q.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{q.title}</p>
              <p className="text-xs text-slate-500">
                {q.classroom_name} · {q.question_count} questions
              </p>
            </div>
            {q.my_attempt_score ? (
              <p className="text-sm text-emerald-600 font-medium">
                {q.my_attempt_score.score}/{q.my_attempt_score.total} scored
              </p>
            ) : (
              <Link
                to={`/student/quiz/${q.id}`}
                className="bg-indigo-600 text-white text-sm rounded-md px-3 py-1.5 font-medium hover:bg-indigo-700"
              >
                Take quiz
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
