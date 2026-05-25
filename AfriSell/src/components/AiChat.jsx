import { useState, useRef } from 'react'
import { Sparkles, X, Send, Loader2 } from 'lucide-react'
import { api } from '../services/api'

const INITIAL = [
  { role: 'assistant', text: 'Bonjour ! Je génère des descriptions de produits. Décrivez brièvement votre article.' },
]

export default function AiChat({ productContext = {}, onApplyText }) {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState(INITIAL)
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef(null)

  const send = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text }])
    setLoading(true)
    try {
      const res = await api.post('/api/studio/ai/describe/', {
        prompt: text,
        context: productContext,
      })
      const reply = res?.text || res?.description || 'Voici une suggestion.'
      setMessages((prev) => [...prev, { role: 'assistant', text: reply, applyable: true }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Une erreur est survenue. Réessayez.' },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition"
        title="Assistant IA"
      >
        {open ? <X size={18} /> : <Sparkles size={18} />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-h-96">
          <div className="px-4 py-3 bg-green-600 text-white flex items-center gap-2 shrink-0">
            <Sparkles size={14} />
            <span className="font-bold text-sm">Assistant IA</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  m.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'
                }`}>
                  {m.text}
                  {m.applyable && onApplyText && (
                    <button
                      onClick={() => { onApplyText(m.text); setOpen(false) }}
                      className="block mt-1.5 text-green-700 font-bold hover:underline"
                    >
                      Utiliser ce texte →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-xl">
                  <Loader2 size={12} className="animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-2 border-t border-gray-100 flex gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Votre message…"
              className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 transition"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-8 h-8 bg-green-600 text-white rounded-xl flex items-center justify-center hover:bg-green-700 disabled:opacity-50 transition shrink-0"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
