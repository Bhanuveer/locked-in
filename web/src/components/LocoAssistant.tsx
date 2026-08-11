import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api, type StudySession } from '../lib/api'

interface SpeechRecognitionResultLike {
  transcript: string
}
interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike }; length: number }
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as (new () => SpeechRecognitionLike) | null
}

function speak(text: string, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) {
    onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1.02
  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

const WAKE_PATTERNS = ['loco', 'loko', 'logo', 'low co', 'lockoh']
function isWakePhrase(text: string) {
  const lower = text.toLowerCase()
  return WAKE_PATTERNS.some((p) => lower.includes(p))
}

type LocoStatus = 'off' | 'starting' | 'listening-for-wake' | 'awake' | 'listening-for-command' | 'working'

export function LocoAssistant({
  onPartialFill,
}: {
  onPartialFill: (fields: { subject?: string; topic?: string; planned_duration_minutes?: number | null }) => void
}) {
  const [status, setStatus] = useState<LocoStatus>('off')
  const [lastHeard, setLastHeard] = useState('')
  const [micError, setMicError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const enabledRef = useRef(false)
  // Bumped on every intentional phase change so stale onend/onerror/onresult
  // callbacks from a previous recognition instance can't act after the fact.
  const genRef = useRef(0)
  const isSupported = getSpeechRecognitionCtor() !== null

  const parseVoice = useMutation({
    mutationFn: async (text: string) =>
      (
        await api.post<{ subject: string; topic: string; planned_duration_minutes: number | null }>(
          '/voice/parse-session/',
          { text }
        )
      ).data,
  })

  const startSession = useMutation({
    mutationFn: async (payload: { subject: string; topic: string; planned_duration_minutes: number }) =>
      (await api.post<StudySession>('/sessions/start/', payload)).data,
  })

  useEffect(() => {
    return () => {
      genRef.current += 1
      enabledRef.current = false
      recognitionRef.current?.stop()
    }
  }, [])

  function startInstance(continuous: boolean, onFinal: (text: string) => void, myGen: number) {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.continuous = continuous
    recognition.interimResults = false

    recognition.onresult = (event) => {
      if (genRef.current !== myGen) return
      const text = event.results[event.results.length - 1][0].transcript
      onFinal(text)
    }
    recognition.onerror = (event) => {
      if (genRef.current !== myGen) return
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicError('Microphone access is blocked. Allow it for this site in your browser settings, then enable Loco again.')
        enabledRef.current = false
        setStatus('off')
        return
      }
      if (continuous && enabledRef.current) {
        setTimeout(() => {
          if (genRef.current === myGen) restartWakeListening()
        }, 300)
      }
    }
    recognition.onend = () => {
      if (genRef.current !== myGen) return
      if (continuous && enabledRef.current) {
        setTimeout(() => {
          if (genRef.current === myGen) restartWakeListening()
        }, 250)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function restartWakeListening() {
    if (!enabledRef.current) return
    genRef.current += 1
    const myGen = genRef.current
    setStatus('listening-for-wake')
    setLastHeard('')
    startInstance(true, handleWakeResult, myGen)
  }

  function handleWakeResult(text: string) {
    setLastHeard(text)
    if (isWakePhrase(text)) wake()
  }

  function wake() {
    genRef.current += 1
    recognitionRef.current?.stop()
    setStatus('awake')
    speak('Yes! What would you like to study?', () => {
      if (!enabledRef.current) return
      genRef.current += 1
      const myGen = genRef.current
      setStatus('listening-for-command')
      startInstance(false, handleCommand, myGen)
    })
  }

  async function handleCommand(text: string) {
    setLastHeard(text)
    setStatus('working')
    try {
      const parsed = await parseVoice.mutateAsync(text)
      if (parsed.subject && parsed.topic && parsed.planned_duration_minutes) {
        const session = await startSession.mutateAsync({
          subject: parsed.subject,
          topic: parsed.topic,
          planned_duration_minutes: parsed.planned_duration_minutes,
        })
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
        speak(
          `Starting your ${parsed.subject} session on ${parsed.topic} for ${parsed.planned_duration_minutes} minutes.`,
          () => navigate(`/student/session/${session.id}`)
        )
        return
      }
      onPartialFill(parsed)
      speak("I didn't catch everything — I've filled in what I understood. Check the form and hit start.", () => {
        restartWakeListening()
      })
    } catch {
      speak('Sorry, something went wrong starting that session. Please try again.', () => restartWakeListening())
    }
  }

  function toggle() {
    if (enabledRef.current) {
      genRef.current += 1
      enabledRef.current = false
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
      setStatus('off')
      setLastHeard('')
      setMicError('')
    } else {
      enabledRef.current = true
      setMicError('')
      setStatus('starting')
      speak('Loco is on. Just say "Loco" any time to start a session.', () => {
        if (!enabledRef.current) return
        restartWakeListening()
      })
    }
  }

  if (!isSupported) {
    return (
      <span className="text-xs text-slate-400">Loco needs Chrome or Edge — voice isn't supported in this browser.</span>
    )
  }

  const isActive = status !== 'off' && status !== 'starting'
  const isBusy = status === 'awake' || status === 'listening-for-command' || status === 'working'

  const statusText: Record<LocoStatus, string> = {
    off: 'Loco is off',
    starting: 'Waking up...',
    'listening-for-wake': 'Listening for "Loco"...',
    awake: 'Loco is awake...',
    'listening-for-command': 'Go ahead, I\'m listening...',
    working: 'Working on it...',
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className={`flex items-center gap-1.5 text-sm rounded-md px-3 py-1.5 font-medium border transition ${
            status === 'off'
              ? 'border-fuchsia-300 text-fuchsia-600 hover:bg-fuchsia-50'
              : 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white border-transparent'
          }`}
        >
          <span className={isBusy ? 'animate-pulse' : ''}>🤖</span> {status === 'off' ? 'Enable Loco' : 'Loco is on'}
        </button>
        {status !== 'off' && (
          <span className={`text-xs ${isActive ? 'text-fuchsia-600' : 'text-slate-500'} ${isBusy ? 'animate-pulse' : ''}`}>
            {statusText[status]}
          </span>
        )}
      </div>
      {lastHeard && status !== 'off' && (
        <p className="text-xs text-slate-400 max-w-xs text-right">Heard: "{lastHeard}"</p>
      )}
      {micError && <p className="text-xs text-red-500 max-w-xs text-right">{micError}</p>}
    </div>
  )
}
