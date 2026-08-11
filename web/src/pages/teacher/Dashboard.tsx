import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type ClassRoom, type Homework, type StudySession } from '../../lib/api'

export function TeacherDashboard() {
  const queryClient = useQueryClient()
  const [className, setClassName] = useState('')
  const [addStudentUsername, setAddStudentUsername] = useState<Record<number, string>>({})
  const [hwClassId, setHwClassId] = useState<number | ''>('')
  const [hwTitle, setHwTitle] = useState('')
  const [hwTopic, setHwTopic] = useState('')
  const [hwRef, setHwRef] = useState('')
  const [error, setError] = useState('')

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<ClassRoom[]>('/classes/')).data,
  })
  const { data: homework } = useQuery({
    queryKey: ['homework'],
    queryFn: async () => (await api.get<Homework[]>('/homework/')).data,
  })
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => (await api.get<StudySession[]>('/sessions/')).data,
  })

  const createClass = useMutation({
    mutationFn: async () => (await api.post('/classes/', { name: className })).data,
    onSuccess: () => {
      setClassName('')
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })

  const addStudent = useMutation({
    mutationFn: async ({ classId, username }: { classId: number; username: string }) =>
      (await api.post(`/classes/${classId}/students/`, { username })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes'] }),
    onError: () => setError('Could not add student — check the username is correct and belongs to a student.'),
  })

  const createHomework = useMutation({
    mutationFn: async () =>
      (
        await api.post('/homework/', {
          classroom: hwClassId,
          title: hwTitle,
          topic: hwTopic,
          reference_text: hwRef,
        })
      ).data,
    onSuccess: () => {
      setHwTitle('')
      setHwTopic('')
      setHwRef('')
      queryClient.invalidateQueries({ queryKey: ['homework'] })
    },
  })

  function handleCreateClass(e: FormEvent) {
    e.preventDefault()
    if (className.trim()) createClass.mutate()
  }

  function handleAddStudent(e: FormEvent, classId: number) {
    e.preventDefault()
    setError('')
    const username = addStudentUsername[classId]
    if (username?.trim()) addStudent.mutate({ classId, username: username.trim() })
  }

  function handleCreateHomework(e: FormEvent) {
    e.preventDefault()
    if (hwClassId && hwTitle && hwTopic) createHomework.mutate()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Your classes</h2>
        <form onSubmit={handleCreateClass} className="flex gap-2 mb-6">
          <input
            className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
            placeholder="New class name, e.g. Class 10A"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
          <button
            disabled={createClass.isPending}
            className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Create
          </button>
        </form>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <div className="space-y-4">
          {classes?.map((c) => (
            <div key={c.id} className="border border-slate-200 rounded-lg p-4">
              <p className="font-medium text-slate-800">
                {c.name} <span className="text-xs text-slate-400">({c.student_count} students)</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {c.students.map((s) => (
                  <span key={s.id} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-1">
                    {s.username}
                  </span>
                ))}
              </div>
              <form onSubmit={(e) => handleAddStudent(e, c.id)} className="flex gap-2">
                <input
                  className="flex-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  placeholder="Student username"
                  value={addStudentUsername[c.id] || ''}
                  onChange={(e) => setAddStudentUsername({ ...addStudentUsername, [c.id]: e.target.value })}
                />
                <button className="text-sm border border-slate-300 rounded-md px-3 py-1.5 text-slate-600">
                  Add student
                </button>
              </form>
            </div>
          ))}
          {classes?.length === 0 && <p className="text-sm text-slate-400">No classes yet — create one above.</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Homework</h2>
        <form onSubmit={handleCreateHomework} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <select
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
            value={hwClassId}
            onChange={(e) => setHwClassId(Number(e.target.value))}
          >
            <option value="">Select class...</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
            placeholder="Title"
            value={hwTitle}
            onChange={(e) => setHwTitle(e.target.value)}
          />
          <input
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
            placeholder="Topic"
            value={hwTopic}
            onChange={(e) => setHwTopic(e.target.value)}
          />
          <input
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
            placeholder="Reference text (optional)"
            value={hwRef}
            onChange={(e) => setHwRef(e.target.value)}
          />
          <button
            disabled={createHomework.isPending}
            className="sm:col-span-2 bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Assign homework
          </button>
        </form>
        <div className="space-y-2">
          {homework?.map((h) => (
            <div key={h.id} className="border border-slate-200 rounded-lg p-3">
              <p className="font-medium text-slate-800 text-sm">
                {h.title} <span className="text-xs text-slate-400">({h.classroom_name})</span>
              </p>
              <p className="text-xs text-slate-500">Topic: {h.topic}</p>
            </div>
          ))}
          {homework?.length === 0 && <p className="text-sm text-slate-400">No homework assigned yet.</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Student session history</h2>
        <div className="space-y-2">
          {sessions?.map((s) => (
            <div key={s.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {s.student_username} — {s.subject}/{s.topic}
                </p>
                <p className="text-xs text-slate-500">
                  {s.status} · {s.actual_duration_minutes ?? '-'} min
                </p>
              </div>
              <p className="text-sm text-slate-600">
                {s.questions_correct}/{s.questions_asked} correct
              </p>
            </div>
          ))}
          {sessions?.length === 0 && <p className="text-sm text-slate-400">No sessions from your students yet.</p>}
        </div>
      </div>
    </div>
  )
}
