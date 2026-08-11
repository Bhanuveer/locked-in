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
