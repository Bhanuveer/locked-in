import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type QuizAttempt, type QuizDetail } from '../../lib/api'

const OPTIONS = ['A', 'B', 'C', 'D'] as const

export function QuizTake() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<QuizAttempt | null>(null)

  const { data: quiz } = useQuery({
    queryKey: ['quiz', id],
    queryFn: async () => (await api.get<QuizDetail>(`/quizzes/${id}/`)).data,
  })

  const submit = useMutation({
    mutationFn: async () => {
      const payload = {
        answers: Object.entries(answers).map(([question_id, selected_option]) => ({
          question_id: Number(question_id),
          selected_option,
        })),
      }
      return (await api.post<QuizAttempt>(`/quizzes/${id}/attempt/`, payload)).data
    },
    onSuccess: (data) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
    },
  })

  if (!quiz) return <div className="p-8 text-center text-slate-400">Loading quiz...</div>

  if (result) {
    const answerByQuestion = Object.fromEntries(result.answers.map((a) => [a.question, a]))
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <h1 className="text-xl font-semibold text-slate-800 mb-1">Quiz complete</h1>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            {result.score}/{result.total_questions}
          </p>
          <button
            onClick={() => navigate('/student/quizzes')}
            className="mt-4 bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            Back to quizzes
          </button>
        </div>
        {quiz.questions.map((q) => {
          const a = answerByQuestion[q.id]
          return (
            <div key={q.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-800 mb-2">{q.question_text}</p>
              <p className={`text-sm ${a?.is_correct ? 'text-emerald-600' : 'text-red-500'}`}>
                {a?.is_correct ? '✓ Correct' : `✗ You picked ${a?.selected_option}. Correct: ${q.correct_option}`}
              </p>
            </div>
          )
        })}
      </div>
    )
  }

  const allAnswered = quiz.questions.every((q) => answers[q.id])

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-lg font-semibold text-slate-800">{quiz.title}</h1>
      {quiz.questions.map((q, idx) => (
        <div key={q.id} className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm font-medium text-slate-800 mb-3">
            {idx + 1}. {q.question_text}
          </p>
          <div className="space-y-2">
            {OPTIONS.map((opt) => {
              const text = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }[opt]
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer ${
                    answers[q.id] === opt ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                  />
                  <span className="font-medium text-slate-500">{opt}.</span> {text}
                </label>
              )
            })}
          </div>
        </div>
      ))}
      <button
        onClick={() => submit.mutate()}
        disabled={!allAnswered || submit.isPending}
        className="w-full bg-indigo-600 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {submit.isPending ? 'Submitting...' : allAnswered ? 'Submit quiz' : `Answer all ${quiz.questions.length} questions`}
      </button>
    </div>
  )
}
