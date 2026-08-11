# Locked in — AI-Powered Study Accountability App

A cross-platform system (web dashboard + mobile app + smartwatch companion) that helps students build consistent study habits by locking distracting apps during study sessions, using AI to ask topic-related questions mid-session to verify real studying, using wearable sensors to gauge engagement, and keeping parents and teachers informed through a dashboard.

## Table of contents
- [Problem it solves](#problem-it-solves)
- [User roles](#user-roles)
- [Features by phase](#features-by-phase)
- [System flow](#system-flow)
- [Tech stack](#tech-stack)
- [Data models](#data-models)
- [API endpoints](#api-endpoints)
- [Environment variables](#environment-variables)
- [Getting started](#getting-started)
- [Non-goals / constraints](#non-goals--constraints)
- [Build order](#build-order)

## Problem it solves
Students often say they are "studying" but are actually distracted. Parents have no visibility into actual study behavior. Teachers have no easy way to assign and track homework completion tied to real study effort. This app closes that loop using scheduling, AI-generated comprehension checks, and basic biometric/motion signals.

## User roles
- **Student**: sets study sessions, studies with app-locking active, answers AI questions, completes teacher-assigned homework.
- **Teacher**: creates classes, assigns homework/topics, views which students studied and how they performed on AI checks.
- **Parent**: linked to one or more students, receives notifications, views weekly/session reports.
- **Admin** (later phase): manages schools, teachers, and platform-level settings. Not required for MVP.

## Features by phase

### Phase 1 — MVP (build this first)
1. Auth: student, teacher, parent signup/login with role-based access (JWT).
2. Student can create a study session: subject, topic, duration.
3. Timer runs for the session; on Android, distracting apps are blocked using UsageStatsManager/AccessibilityService while session is active.
4. Mid-session (e.g. every 10–15 min), the AI engine generates a short question about the chosen topic and the student answers via text.
5. AI checks the answer and marks it correct/incorrect with brief feedback.
6. Session ends: summary saved (duration, questions asked, questions correct, was session completed or abandoned early).
7. Teacher can create a class, add students, and upload/assign a homework topic with a short description or reference text.
8. Parent linked to a student account (invite by code or email) and can view a simple list of the student's past sessions and homework status.
9. Web dashboard (React) for teacher and parent — session history, homework list, basic charts (sessions per week, avg accuracy).

### Phase 2 — after MVP validated
1. Wear OS companion app: vibration alarms for session start/end, and simple on-watch question prompt (yes/no or tap).
2. Heart rate + motion data collected during sessions via Health Connect API, stored and shown as an "engagement score" (clearly labeled as an estimate, not a guarantee).
3. Push notifications to parent (Firebase Cloud Messaging) when a student skips a scheduled session or fails multiple questions in a row.
4. Voice commands ("start my Maths session for 1 hour") using on-device speech-to-text + wake word (Porcupine) + LLM intent parsing.

### Phase 3 — later
1. Admin panel for schools/multiple teachers.
2. Analytics: study streaks, subject-wise performance trends over time.
3. iOS support investigation (Apple has stricter limits on app-blocking and background sensor access — needs separate research before committing).

## System flow
1. Student sets up a study session in the app (subject, topic, duration).
2. App and watch lock distracting apps and start the timer/alarm.
3. Mid-session, the AI engine generates a question tied to the topic and asks the student.
4. Sensors (phase 2) and answer correctness combine into an engagement/completion record for the session.
5. Session data is sent to the backend and surfaces on the teacher and parent dashboards, with notifications sent if the student skipped or struggled.

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Backend framework | Django + Django REST Framework | Main REST API, admin panel, auth |
| Database | PostgreSQL | Relational data: users, classes, sessions, questions, answers |
| Real-time | Django Channels + Redis | Live session status, instant notifications |
| Web frontend | React + Vite + TypeScript + Tailwind CSS | Teacher/parent dashboard |
| Data fetching (web) | React Query (TanStack Query) + Axios | |
| Mobile app | React Native (Expo) | Student app, and parent app if mobile is needed |
| Mobile navigation | React Navigation | |
| Wearable app | Wear OS, Kotlin | Native — cannot be built in React |
| Wearable sensors | Health Connect API / Wear OS Health Services | Heart rate, motion |
| AI provider (primary) | Groq API (Llama 3.3 70B) | Free tier, fast — used for question generation and answer checking |
| AI provider (backup) | Google Gemini API (Gemini 2.0/2.5 Flash) | Free tier |
| AI provider (experimental) | Hugging Face Inference API | Optional, for testing open models |
| Auth | Django + djangorestframework-simplejwt | Role-based: student / teacher / parent |
| Notifications | Firebase Cloud Messaging | Push alerts |
| App-locking (Android) | Native Kotlin module bridged into React Native, using UsageStatsManager + AccessibilityService | Cannot be pure JS |
| Voice commands | @react-native-voice/voice + Porcupine wake word | Phase 2 |
| File storage | Cloudinary or AWS S3 | Homework file uploads |
| Hosting (prototype) | Render or Railway (backend), Vercel (web frontend), Supabase (managed Postgres) | Free tiers |
| Dev tooling | Docker (Postgres + Redis locally), Postman, GitHub | |

## Data models

Suggested Django models:

```
User (Django's built-in User extended with a Profile)
  - role: student | teacher | parent
  - linked_parent (for students, optional FK to a Parent profile)

ClassRoom
  - name
  - teacher (FK to User)
  - students (M2M to User)

Homework
  - classroom (FK)
  - title
  - topic
  - reference_text (or file upload)
  - due_date
  - created_by (FK teacher)

StudySession
  - student (FK)
  - subject
  - topic
  - homework (FK, nullable — session may or may not be tied to assigned homework)
  - planned_duration_minutes
  - actual_duration_minutes
  - status: in_progress | completed | abandoned
  - started_at
  - ended_at

SessionQuestion
  - session (FK)
  - question_text
  - student_answer
  - is_correct (nullable until answered)
  - ai_feedback
  - asked_at

ParentStudentLink
  - parent (FK)
  - student (FK)
  - invite_status: pending | accepted

EngagementReading (Phase 2, from wearable)
  - session (FK)
  - timestamp
  - heart_rate
  - motion_level
```

## API endpoints

Suggested DRF endpoints:

```
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/refresh/

GET    /api/classes/                (teacher: own classes, student: enrolled classes)
POST   /api/classes/                (teacher only)
POST   /api/classes/{id}/students/  (add student to class)

GET    /api/homework/               (filtered by role)
POST   /api/homework/               (teacher only)

POST   /api/sessions/start/         (student starts a session)
POST   /api/sessions/{id}/end/      (student ends a session)
GET    /api/sessions/               (list, filtered by role: student sees own, teacher sees class, parent sees linked child)
GET    /api/sessions/{id}/

POST   /api/sessions/{id}/questions/generate/   (calls AI engine, returns a question)
POST   /api/sessions/{id}/questions/{qid}/answer/  (student submits answer, AI checks it)

GET    /api/parent/children/        (parent's linked students)
POST   /api/parent/link-request/    (link to a student by code)
```

## Environment variables

Create a `.env` file (never commit this to git):

```
DJANGO_SECRET_KEY=
DEBUG=True
DATABASE_URL=postgres://user:password@localhost:5432/studyapp_db
REDIS_URL=redis://localhost:6379

GROQ_API_KEY=
GEMINI_API_KEY=
HF_TOKEN=

FIREBASE_CREDENTIALS_JSON=
CLOUDINARY_URL=
```

## Getting started

```bash
# Backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install django djangorestframework psycopg2-binary django-environ djangorestframework-simplejwt channels redis groq google-generativeai

# Start Postgres + Redis locally with Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=yourpassword postgres
docker run -d -p 6379:6379 redis

# Run migrations and start the server
python manage.py migrate
python manage.py runserver
```

```bash
# Web frontend
npm create vite@latest web -- --template react-ts
cd web
npm install axios @tanstack/react-query tailwindcss

# Mobile app
npx create-expo-app mobile
cd mobile
npm install @react-navigation/native axios @tanstack/react-query
```

## Non-goals / constraints
- No iOS app in MVP (Android only, due to app-locking and sensor access limitations on iOS).
- No custom hardware — use existing Wear OS smartwatches, not a custom band.
- Engagement scoring from sensors is an estimate, not a guarantee of studying — this must be communicated honestly in the UI, not oversold as "detects cheating."
- Admin/multi-school management is out of scope until after MVP is validated with real users.

## Build order
1. Django project setup with DRF, PostgreSQL, JWT auth, and the data models above.
2. Basic role-based auth (student/teacher/parent) with registration and login.
3. Class and homework CRUD (teacher side).
4. Study session start/end endpoints with timer logic.
5. AI engine integration (Groq first) for question generation and answer checking, wired into the session-question endpoints.
6. React web dashboard: login, teacher view (classes, homework, student session history), parent view (linked children, session history).
7. React Native student app: login, start/end session screen, mid-session question prompt UI.
8. Only after the above works end-to-end: Android app-locking module, Wear OS companion app, sensor data collection, push notifications, voice commands.