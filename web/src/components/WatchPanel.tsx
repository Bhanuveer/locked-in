import { lazy, Suspense } from 'react'

const Watch3D = lazy(() => import('./Watch3D').then((m) => ({ default: m.Watch3D })))

interface WatchPanelProps {
  elapsedSeconds: number
  subject: string
  topic: string
  pendingQuestionText: string | null
  lastAnswerCorrect: boolean | null
  vibrateSignal: number
}

export function WatchPanel(props: WatchPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
      <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-1">⌚ Wear OS companion</p>
      <p className="text-xs text-slate-400 mb-3">Simulated — mirrors this session live. Drag to rotate, scroll to zoom.</p>
      <div className="flex-1">
        <Suspense
          fallback={
            <div className="w-full h-full min-h-[420px] flex items-center justify-center text-sm text-slate-400">
              Loading 3D watch...
            </div>
          }
        >
          <Watch3D {...props} />
        </Suspense>
      </div>
    </div>
  )
}
