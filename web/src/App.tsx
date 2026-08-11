import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './lib/auth'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { StudentDashboard } from './pages/student/Dashboard'
import { SessionPage } from './pages/student/SessionPage'
import { StudentQuizzes } from './pages/student/Quizzes'
import { QuizTake } from './pages/student/QuizTake'
import { StudentHomeworkList } from './pages/student/HomeworkList'
import { HomeworkAssistant } from './pages/student/HomeworkAssistant'
import { StudentAttendance } from './pages/student/Attendance'
import { TeacherDashboard } from './pages/teacher/Dashboard'
import { TeacherQuizzes } from './pages/teacher/Quizzes'
import { TeacherProgress } from './pages/teacher/Progress'
import { TeacherAttendance } from './pages/teacher/Attendance'
import { ParentDashboard } from './pages/parent/Dashboard'
import { ParentAttendance } from './pages/parent/Attendance'

function Home() {
  const { user } = useAuth()
  if (user) return <Navigate to={`/${user.role}`} replace />
  return <Landing />
}

function App() {
  const { user } = useAuth()
  const location = useLocation()
  const publicPages = ['/', '/login', '/register']
  const showNavbar = user || !publicPages.includes(location.pathname)

  return (
    <div className="min-h-screen bg-slate-50">
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/session/:id" element={<ProtectedRoute role="student"><SessionPage /></ProtectedRoute>} />
        <Route path="/student/quizzes" element={<ProtectedRoute role="student"><StudentQuizzes /></ProtectedRoute>} />
        <Route path="/student/quiz/:id" element={<ProtectedRoute role="student"><QuizTake /></ProtectedRoute>} />
        <Route path="/student/homework" element={<ProtectedRoute role="student"><StudentHomeworkList /></ProtectedRoute>} />
        <Route path="/student/homework/:id" element={<ProtectedRoute role="student"><HomeworkAssistant /></ProtectedRoute>} />
        <Route path="/student/attendance" element={<ProtectedRoute role="student"><StudentAttendance /></ProtectedRoute>} />

        <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/quizzes" element={<ProtectedRoute role="teacher"><TeacherQuizzes /></ProtectedRoute>} />
        <Route path="/teacher/progress" element={<ProtectedRoute role="teacher"><TeacherProgress /></ProtectedRoute>} />
        <Route path="/teacher/attendance" element={<ProtectedRoute role="teacher"><TeacherAttendance /></ProtectedRoute>} />

        <Route path="/parent" element={<ProtectedRoute role="parent"><ParentDashboard /></ProtectedRoute>} />
        <Route path="/parent/attendance" element={<ProtectedRoute role="parent"><ParentAttendance /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App
