import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type ParentLink } from '../../lib/api'
import { AttendanceGrid } from '../../components/AttendanceGrid'

export function ParentAttendance() {
  const [selected, setSelected] = useState<number | ''>('')

  const { data: children } = useQuery({
    queryKey: ['children'],
    queryFn: async () => (await api.get<ParentLink[]>('/auth/parent/children/')).data,
  })

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-lg font-semibold text-slate-800 mb-4">🔥 Attendance</h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <select
          className="border border-slate-300 rounded-md px-3 py-2 text-sm mb-4"
          value={selected}
          onChange={(e) => setSelected(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Select your child...</option>
          {children?.map((c) => (
            <option key={c.student} value={c.student}>
              {c.student_username}
            </option>
          ))}
        </select>
        {selected ? (
          <AttendanceGrid studentId={selected} />
        ) : (
          <p className="text-sm text-slate-400">Pick a linked child to see their attendance.</p>
        )}
      </div>
    </div>
  )
}
