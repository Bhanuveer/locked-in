import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api, type Homework, type HomeworkChatMessage } from '../../lib/api'

export function HomeworkAssistant() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: homework } = useQuery({
    queryKey: ['homework-item', id],
    queryFn: async () => (await api.get<Homework[]>('/homework/')).data.find((h) => h.id === Number(id)),
  })

  const { data: messages } = useQuery({
    queryKey: ['homework-chat', id],
    queryFn: async () => (await api.get<HomeworkChatMessage[]>(`/homework/${id}/assistant/`)).data,
  })

  const send = useMutation({
    mutationFn: async () => (await api.post(`/homework/${id}/assistant/`, { message })).data,
    onSuccess: () => {
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['homework-chat', id] })
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (message.trim()) send.mutate()
  }

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col" style={{ height: 'calc(100vh - 65px)' }}>
      <div className="mb-3">
        <h1 className="text-lg font-semibold text-slate-800">{homework?.title}</h1>
        <p className="text-xs text-slate-500">Topic: {homework?.topic} — assistant only uses this material</p>
      </div>

      <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        {messages?.length === 0 && (
          <p className="text-sm text-slate-400 text-center mt-8">
            Ask a question about "{homework?.topic}" and the AI will help using only today's material.
          </p>
        )}
        {messages?.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {send.isPending && <p className="text-xs text-slate-400">Assistant is thinking...</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
        <input
          className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
          placeholder="Ask a question about this homework..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={send.isPending}
        />
        <button
          disabled={send.isPending || !message.trim()}
          className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
