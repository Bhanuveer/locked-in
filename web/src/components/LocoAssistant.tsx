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
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event) => void) | null
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
  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

type LocoStatus = 'off' | 'listening-for-wake' | 'awake' | 'listening-for-command' | 'working'

export function LocoAssistant({
  onPartialFill,
}: {
  onPartialFill: (fields: { subject?: string; topic?: string; planned_duration_minutes?: number | null }) => void
}) {
  const [status, setStatus] = useState<LocoStatus>('off')
  const [lastHeard, setLastHeard] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const enabledRef = useRef(false)
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
      enabledRef.current = false
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  function runRecognition(continuous: boolean, onFinal: (text: string) => void) {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.continuous = continuous
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript
      onFinal(text)
    }
    recognition.onerror = () => {
      if (continuous && enabledRef.current) restartWakeListening()
    }
    recognition.onend = () => {
      if (continuous && enabledRef.current) restartWakeListening()
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function restartWakeListening() {
    if (!enabledRef.current) return
    setStatus('listening-for-wake')
    runRecognition(true, handleWakeResult)
  }

  function handleWakeResult(text: string) {
    if (text.toLowerCase().includes('loco')) {
      wake()
    }
  }

  function wake() {
    recognitionRef.current?.stop()
    setStatus('awake')
    speak('Yes? What do you want to study?', () => {
      if (!enabledRef.current) return
      setStatus('listening-for-command')
      runRecognition(false, handleCommand)
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
        speak(`Starting your ${parsed.subject} session on ${parsed.topic} for ${parsed.planned_duration_minutes} minutes.`)
        navigate(`/student/session/${session.id}`)
        return
      }
      onPartialFill(parsed)
      speak("I didn't catch everything — I've filled in what I understood. Check the form and hit start.", () => {
        restartWakeListening()
      })
    } catch {
      speak('Sorry, something went wrong. Please try again.', () => restartWakeListening())
    }
  }

  function toggle() {
    if (enabledRef.current) {
      enabledRef.current = false
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
      setStatus('off')
    } else {
      enabledRef.current = true
      setStatus('listening-for-wake')
      runRecognition(true, handleWakeResult)
    }
  }

  if (!isSupported) {
    return (
      <span className="text-xs text-slate-400">Loco needs Chrome or Edge — voice isn't supported in this browser.</span>
    )
  }

  const statusText: Record<LocoStatus, string> = {
    off: 'Loco is off',
    'listening-for-wake': 'Listening for "Loco"...',
    awake: 'Loco is awake...',
    'listening-for-command': 'Go ahead, I\'m listening...',
    working: `Working on it${lastHeard ? `: "${lastHeard}"` : '...'}`,
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-1.5 text-sm rounded-md px-3 py-1.5 font-medium border ${
          status === 'off'
            ? 'border-fuchsia-300 text-fuchsia-600 hover:bg-fuchsia-50'
            : 'bg-fuchsia-600 text-white border-fuchsia-600'
        }`}
      >
        <span>🤖</span> {status === 'off' ? 'Enable Loco' : 'Loco is on'}
      </button>
      {status !== 'off' && (
        <span className={`text-xs ${status === 'awake' || status === 'listening-for-command' ? 'text-fuchsia-600 animate-pulse' : 'text-slate-500'}`}>
          {statusText[status]}
        </span>
      )}
    </div>
  )
}
