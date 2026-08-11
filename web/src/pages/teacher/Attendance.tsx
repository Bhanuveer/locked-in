import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type ClassRoom } from '../../lib/api'
import { AttendanceGrid } from '../../components/AttendanceGrid'

export function TeacherAttendance() {
  const [selected, setSelected] = useState<number | ''>('')

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<ClassRoom[]>('/classes/')).data,
  })

  const allStudents = classes?.flatMap((c) => c.students) ?? []
  const uniqueStudents = Array.from(new Map(allStudents.map((s) => [s.id, s])).values())

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-lg font-semibold text-slate-800 mb-4">Student attendance</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <select
          className="border border-slate-300 rounded-md px-3 py-2 text-sm mb-4"
          value={selected}
          onChange={(e) => setSelected(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Select a student...</option>
          {uniqueStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.username}
            </option>
          ))}
        </select>
        {selected ? (
          <AttendanceGrid studentId={selected} />
        ) : (
          <p className="text-sm text-slate-400">Pick a student to see their attendance.</p>
        )}
      </div>
    </div>
  )
}
