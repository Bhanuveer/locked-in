import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

export function MicButton({
  onResult,
  label = 'Speak',
  listeningLabel = 'Listening...',
  className = '',
}: {
  onResult: (text: string) => void
  label?: string
  listeningLabel?: string
  className?: string
}) {
  const { isSupported, isListening, startListening } = useSpeechRecognition()

  if (!isSupported) {
    return (
      <span className="text-xs text-slate-400" title="Voice input needs Chrome or Edge">
        🎤 Voice input not supported in this browser
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => startListening(onResult)}
      disabled={isListening}
      className={
        className ||
        `flex items-center gap-1.5 text-sm rounded-md px-3 py-1.5 font-medium border ${
          isListening
            ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
            : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'
        }`
      }
    >
      <span>🎤</span> {isListening ? listeningLabel : label}
    </button>
  )
}
