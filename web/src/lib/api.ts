import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const api = axios.create({ baseURL: API_BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface User {
  id: number
  username: string
  email: string
  role: 'student' | 'teacher' | 'parent'
  invite_code: string
  points: number
  streak_days: number
  reward_tier: 'none' | 'bronze' | 'silver' | 'gold'
}

export interface SessionQuestion {
  id: number
  session: number
  question_text: string
  student_answer: string
  is_correct: boolean | null
  ai_feedback: string
  asked_at: string
  answered_at: string | null
}

export interface StudySession {
  id: number
  student: number
  student_username: string
  subject: string
  topic: string
  homework: number | null
  planned_duration_minutes: number
  actual_duration_minutes: number | null
  status: 'in_progress' | 'completed' | 'abandoned'
  started_at: string
  ended_at: string | null
  abandon_reason: string
  questions: SessionQuestion[]
  questions_asked: number
  questions_correct: number
}

export interface ClassRoom {
  id: number
  name: string
  teacher: number
  teacher_username: string
  students: { id: number; username: string; email: string }[]
  student_count: number
  created_at: string
}

export interface Homework {
  id: number
  classroom: number
  classroom_name: string
  title: string
  topic: string
  reference_text: string
  due_date: string | null
  created_by: number
  created_at: string
}

export interface ParentLink {
  id: number
  parent: number
  student: number
  parent_username: string
  student_username: string
  invite_status: string
  created_at: string
}

export interface QuizQuestion {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option?: 'A' | 'B' | 'C' | 'D'
  order: number
}

export interface Quiz {
  id: number
  classroom: number
  classroom_name: string
  homework: number | null
  title: string
  topic: string
  created_by: number
  created_at: string
  question_count: number
  my_attempt_score: { score: number; total: number } | null
}

export interface QuizDetail extends Quiz {
  questions: QuizQuestion[]
}

export interface QuizAnswer {
  question: number
  selected_option: string
  is_correct: boolean
}

export interface QuizAttempt {
  id: number
  quiz: number
  quiz_title: string
  student: number
  student_username: string
  score: number
  total_questions: number
  taken_at: string
  answers: QuizAnswer[]
}

export interface HomeworkChatMessage {
  id: number
  homework: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface AttendanceDay {
  date: string
  session_count: number
  completed_count: number
  quiz_taken: boolean
}

export interface Attendance {
  student_username: string
  streak_days: number
  points: number
  days: AttendanceDay[]
}
