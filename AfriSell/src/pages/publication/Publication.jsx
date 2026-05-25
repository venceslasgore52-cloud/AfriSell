import { useState, useEffect } from 'react'
import {
  Send, Plus, Loader2, Trash2, Clock, CheckCircle,
  FileText, X, Save, Calendar, Upload, Image, Edit2,
} from 'lucide-react'
import { studioService } from '../../services/studioService'

const STATUS_STYLE = {
  draft:     { label: 'Brouillon',  cls: 'bg-gray-100 text-gray-600',   icon: FileText    },
  scheduled: { label: 'Planifié',   cls: 'bg-blue-100 text-blue-700',   icon: Clock       },
  published: { label: 'Publié',     cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed:    { label: 'Échec',      cls: 'bg-red-100 text-red-700',     icon: X           },
}

const PLATFORMS = [
  { id: 'WhatsApp',  emoji: '💬', color: 'border-green-400 bg-green-50 text-green-700'  },
  { id: 'Facebook',  emoji: '📘', color: 'border-blue-400 bg-blue-50 text-blue-700'    },
  { id: 'Instagram', emoji: '📸', color: 'border-pink-400 bg-pink-50 text-pink-700'    },
  { id: 'Telegram',  emoji: '✈️', color: 'border-sky-400 bg-sky-50 text-sky-700'       },
]

const CAPTION_MAX = 2200
const EMPTY = { caption: '', platforms: [], scheduled_at: '', status: 'draft', image: null }

function PostModal({ post, onClose, onSaved, initialCaption }) {
  const editing = !!post?.id
  const [form, setForm] = useState(editing ? {
    caption:      post.caption || '',
    platforms:    post.platforms || [],
    scheduled_at: post.scheduled_at?.slice(0, 16) || '',
    status:       post.status || 'draft',
    image:        null,
  } : { ...EMPTY, caption: initialCaption || '' })
  const [imagePreview, setImagePreview] = useState(post?.image_url || null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  const captionLen = form.caption.length

  const togglePlatform = (id) =>
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(id)
        ? f.platforms.filter(x => x !== id)
        : [...f.platforms, id],
    }))

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Image trop lourde (max 10 Mo)'); return }
    setForm(f => ({ ...f, image: file }))
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setForm(f => ({ ...f, image: null }))
    setImagePreview(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.caption.trim()) { setError('Le contenu est obligatoire.'); return }
    setLoading(true)
    setError('')
    try {
      const payload = { ...form, scheduled_at: form.scheduled_at || null }
      delete payload.image
      if (editing) await studioService.updatePost(post.id, payload)
      else await studioService.createPost(payload)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-900">{editing ? 'Modifier le post' : 'Nouveau post'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Contenu */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">Contenu *</label>
              <span className={`text-xs font-medium ${captionLen > CAPTION_MAX * 0.9 ? 'text-red-500' : 'text-gray-400'}`}>
                {captionLen}/{CAPTION_MAX}
              </span>
            </div>
            <textarea
              value={form.caption}
              onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              maxLength={CAPTION_MAX}
              rows={6}
              placeholder="Rédigez votre post…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Plateformes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Plateformes</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const selected = form.platforms.includes(p.id)
                return (
                  <button
                    key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition
                      ${selected ? p.color : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    <span>{p.emoji}</span> {p.id}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-1"><Image size={11} /> Image (optionnel)</span>
            </label>
            {imagePreview ? (
              <div className="relative w-full rounded-xl overflow-hidden border border-gray-200">
                <img src={imagePreview} alt="preview" className="w-full max-h-40 object-cover" />
                <button
                  type="button" onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-green-400 transition text-sm text-gray-500">
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                <Upload size={15} className="text-gray-400" />
                Cliquer pour ajouter une image
              </label>
            )}
          </div>

          {/* Planification */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
              <Calendar size={11} /> Planification (optionnel)
            </label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={e => setForm(f => ({
                ...f,
                scheduled_at: e.target.value,
                status: e.target.value ? 'scheduled' : 'draft',
              }))}
              className={inputCls}
            />
            {form.scheduled_at && (
              <p className="text-xs text-blue-600 mt-1">
                Publication planifiée le {new Date(form.scheduled_at).toLocaleString('fr-FR', {
                  day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition">
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={loading || !form.caption.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editing ? 'Enregistrer' : form.scheduled_at ? 'Planifier' : 'Créer le post'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Publication() {
  const [posts, setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [modal, setModal]   = useState(null)
  const [filter, setFilter] = useState('')
  const [studioPrefill, setStudioPrefill] = useState(null)

  useEffect(() => {
    const prefill = sessionStorage.getItem('studio_prefill')
    if (prefill) {
      setStudioPrefill(prefill)
      sessionStorage.removeItem('studio_prefill')
      setModal('new')
    }
  }, [])

  const load = (signal) => {
    setLoading(true)
    studioService.posts(signal)
      .then(data => setPosts(Array.isArray(data) ? data : (data?.results ?? [])))
      .catch(err => { if (err?.name !== 'AbortError') setError(err.message) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const ctrl = new AbortController()
    load(ctrl.signal)
    return () => ctrl.abort()
  }, [])

  const deletePost = async (id) => {
    if (!confirm('Supprimer ce post ?')) return
    try {
      await studioService.deletePost(id)
      setPosts(p => p.filter(x => x.id !== id))
    } catch (err) { alert(err.message) }
  }

  const filtered = filter ? posts.filter(p => p.status === filter) : posts

  const handleSaved = () => {
    setModal(null)
    const c = new AbortController()
    load(c.signal)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Send size={20} className="text-blue-500" /> Publications
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {posts.length} post{posts.length !== 1 ? 's' : ''} · planifiez vos publications sur les réseaux.
          </p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <Plus size={16} /> Nouveau post
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {[{ key: '', label: 'Tous' }, ...Object.entries(STATUS_STYLE).map(([k, v]) => ({ key: k, label: v.label }))].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${filter === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-green-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Send size={40} className="mb-3 text-gray-200" />
          <p className="text-sm font-medium">Aucun post{filter ? ' dans cette catégorie' : ''}</p>
          <button onClick={() => setModal('new')} className="mt-4 text-sm text-green-600 font-semibold hover:underline">
            Créer votre premier post →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.draft
            const Icon = s.icon
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                {/* Image du post */}
                {p.image_url && (
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-5 flex flex-col gap-3 flex-1">
                  {/* Statut + actions */}
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
                      <Icon size={11} /> {s.label}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setModal(p)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-green-600"
                        title="Modifier">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => deletePost(p.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition text-gray-400 hover:text-red-500"
                        title="Supprimer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Contenu */}
                  <p className="text-sm text-gray-700 line-clamp-3 flex-1">{p.caption}</p>

                  {/* Plateformes */}
                  {p.platforms?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.platforms.map(pl => {
                        const meta = PLATFORMS.find(x => x.id === pl)
                        return (
                          <span key={pl} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full flex items-center gap-1">
                            {meta?.emoji} {pl}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Date planification */}
                  {p.scheduled_at && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock size={11} />
                      {new Date(p.scheduled_at).toLocaleString('fr-FR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal !== null && (
        <PostModal
          post={modal === 'new' ? null : modal}
          initialCaption={modal === 'new' ? studioPrefill : null}
          onClose={() => { setModal(null); setStudioPrefill(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
