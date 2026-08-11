import { AttendanceGrid } from '../../components/AttendanceGrid'

export function StudentAttendance() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-lg font-semibold text-slate-800 mb-4">Your attendance</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <AttendanceGrid />
      </div>
    </div>
  )
}
