import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Wand2, Loader2, Trash2, Copy, Check,
  ImageOff, Send, History, ChevronDown, ChevronUp,
  MessageSquare, Tag, Megaphone, FileText, Image, Film, LayoutTemplate,
  Upload, Download, AlertCircle, Package,
} from 'lucide-react'
import { studioService } from '../../services/studioService'
import { productService } from '../../services/productService'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CONTENT_TABS = [
  { key: 'text',  label: 'Texte',   icon: FileText,      color: 'purple' },
  { key: 'image', label: 'Image',   icon: Image,         color: 'blue'   },
  { key: 'flyer', label: 'Flyer',   icon: LayoutTemplate, color: 'pink'  },
  { key: 'video', label: 'Vidéo',   icon: Film,          color: 'amber'  },
]

const TEXT_TYPES = [
  { key: 'caption',     label: 'Légende produit',    icon: Tag,           hint: 'Pour illustrer un produit sur les réseaux'   },
  { key: 'promo',       label: 'Message promo',       icon: Megaphone,     hint: 'Offre spéciale, réduction, soldes'           },
  { key: 'whatsapp',    label: 'Message WhatsApp',    icon: MessageSquare, hint: 'Réponse bot ou message de suivi client'      },
  { key: 'description', label: 'Description produit', icon: FileText,      hint: 'Description détaillée pour le catalogue'     },
]

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook',  label: 'Facebook'  },
  { key: 'whatsapp',  label: 'WhatsApp'  },
  { key: 'tiktok',    label: 'TikTok'    },
  { key: 'general',   label: 'Général'   },
]

const LANGUAGES = [
  { key: 'fr',     label: 'Français' },
  { key: 'en',     label: 'English'  },
  { key: 'dioula', label: 'Dioula'   },
  { key: 'wolof',  label: 'Wolof'    },
]

const MAX_HISTORY = 6

// ─── Composants utilitaires ───────────────────────────────────────────────────

function QuotaBadge({ quota }) {
  if (!quota) return null
  const pct   = quota.limit ? Math.round((quota.used / quota.limit) * 100) : 0
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-green-500'
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm">
      <div className="text-sm text-gray-600">
        <span className="font-bold text-gray-900">{quota.used}</span>
        /{quota.limit ?? '∞'} générations ce mois
      </div>
      {quota.limit && (
        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      )}
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition">
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  )
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
            ${value === opt.key
              ? 'border-purple-400 bg-purple-50 text-purple-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function HistoryPanel({ history, onRestore, onClear }) {
  const [open, setOpen] = useState(false)
  if (history.length === 0) return null
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition rounded-2xl"
      >
        <span className="flex items-center gap-2">
          <History size={15} className="text-gray-400" />
          Historique ({history.length})
        </span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && (
        <div className="border-t border-gray-100">
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {history.map((h, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50/50 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      {TEXT_TYPES.find(t => t.key === h.contentType)?.label ?? h.contentType}
                    </span>
                    <span className="text-xs text-gray-400">{h.platform} · {h.language}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-0.5">{h.prompt}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{h.text}</p>
                </div>
                <button
                  onClick={() => onRestore(h)}
                  className="text-xs text-green-600 font-semibold opacity-0 group-hover:opacity-100 transition shrink-0"
                >
                  Restaurer
                </button>
              </div>
            ))}
          </div>
          <div className="px-5 py-2.5 border-t border-gray-100">
            <button onClick={onClear} className="text-xs text-gray-400 hover:text-red-500 transition">
              Vider l'historique
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Formulaire Texte ─────────────────────────────────────────────────────────

function TextForm({ onResult, onQuotaUpdate }) {
  const [contentType, setContentType] = useState('caption')
  const [platform,    setPlatform]    = useState('instagram')
  const [language,    setLanguage]    = useState('fr')
  const [prompt,      setPrompt]      = useState('')
  const [generating,  setGenerating]  = useState(false)
  const [error,       setError]       = useState('')

  const placeholders = {
    caption:     'Ex: Robe en bazin bleu roi, taille 38–46, livraison Abidjan, prix 18 000 FCFA…',
    promo:       "Ex: Soldes de fin d'année, -30% sur toutes les chaussures, stock limité…",
    whatsapp:    "Ex: Message de suivi pour un client qui n'a pas finalisé sa commande…",
    description: 'Ex: Sac à main en cuir véritable, doublure tissu, 3 compartiments, couleur caramel…',
  }

  const generate = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setGenerating(true)
    setError('')
    try {
      const data = await studioService.generateText({
        content_type: contentType,
        platform,
        language,
        prompt,
      })
      const text = data?.text ?? data?.result ?? JSON.stringify(data)
      onResult({ text, contentType, platform, language, prompt })
      if (data?.quota) onQuotaUpdate(data.quota)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const currentType = TEXT_TYPES.find(t => t.key === contentType)

  return (
    <form onSubmit={generate} className="space-y-5">
      {/* Type de contenu */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">Type de contenu</label>
        <div className="grid grid-cols-2 gap-2">
          {TEXT_TYPES.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key} type="button" onClick={() => setContentType(t.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition text-left
                  ${contentType === t.key
                    ? 'border-purple-400 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                <Icon size={13} className={contentType === t.key ? 'text-purple-500' : 'text-gray-400'} />
                {t.label}
              </button>
            )
          })}
        </div>
        {currentType && (
          <p className="text-xs text-gray-400 mt-1.5 ml-0.5">{currentType.hint}</p>
        )}
      </div>

      {/* Plateforme + Langue */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Plateforme</label>
          <SegmentedControl options={PLATFORMS} value={platform} onChange={setPlatform} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Langue</label>
          <SegmentedControl options={LANGUAGES} value={language} onChange={setLanguage} />
        </div>
      </div>

      {/* Contexte */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Description / Contexte
          <span className="font-normal text-gray-400 ml-1">(décrivez votre produit ou l'offre)</span>
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={4}
          required
          placeholder={placeholders[contentType]}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{prompt.length}/1000 caractères</p>
      </div>

      {error && (
        <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={generating || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition"
      >
        {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
        {generating ? 'Génération en cours…' : 'Générer le texte'}
      </button>
    </form>
  )
}

// ─── Formulaire Image (suppression de fond) ───────────────────────────────────

function ImageForm({ onAssetResult }) {
  const [file,      setFile]      = useState(null)
  const [preview,   setPreview]   = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [polling,   setPolling]   = useState(false)
  const [error,     setError]     = useState('')
  const inputRef    = useRef(null)
  const stopPollRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setError('')
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) handleFile(f)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const asset = await studioService.createAsset({ type: 'image', source_image: file })
      setLoading(false)
      setPolling(true)
      stopPollRef.current = studioService.pollAsset(
        asset.id,
        (done) => { setPolling(false); onAssetResult(done) },
        (msg)  => { setPolling(false); setError(msg) },
      )
    } catch (err) {
      setLoading(false)
      setError(err.message)
    }
  }

  useEffect(() => () => stopPollRef.current?.(), [])

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">Image source</label>
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="relative cursor-pointer border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl transition overflow-hidden"
        >
          {preview ? (
            <div className="relative">
              <img src={preview} alt="preview" className="w-full max-h-52 object-contain bg-gray-50" />
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                <p className="text-white text-xs font-medium">Changer l'image</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Upload size={28} className="mb-2 text-blue-300" />
              <p className="text-sm font-medium text-gray-600">Glissez une image ou cliquez</p>
              <p className="text-xs mt-0.5">JPG, PNG, WEBP — max 10 Mo</p>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 flex gap-2">
        <AlertCircle size={14} className="shrink-0 mt-0.5 text-blue-400" />
        <span>L'IA supprime le fond de votre image et la retourne avec un arrière-plan transparent (PNG). Disponible à partir du plan Business.</span>
      </div>

      {error && (
        <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!file || loading || polling}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition"
      >
        {(loading || polling) ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
        {loading ? 'Envoi…' : polling ? 'Traitement en cours…' : 'Supprimer le fond'}
      </button>
    </form>
  )
}

// ─── Formulaire Flyer ─────────────────────────────────────────────────────────

function FlyerForm({ onAssetResult }) {
  const [products,  setProducts]  = useState([])
  const [productId, setProductId] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [polling,   setPolling]   = useState(false)
  const [loadingP,  setLoadingP]  = useState(true)
  const [error,     setError]     = useState('')
  const stopPollRef = useRef(null)

  useEffect(() => {
    productService.list()
      .then(list => { setProducts(list); if (list.length) setProductId(String(list[0].id)) })
      .catch(() => {})
      .finally(() => setLoadingP(false))
    return () => stopPollRef.current?.()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!productId) return
    setLoading(true)
    setError('')
    try {
      const asset = await studioService.createAsset({ type: 'flyer', product: productId })
      setLoading(false)
      setPolling(true)
      stopPollRef.current = studioService.pollAsset(
        asset.id,
        (done) => { setPolling(false); onAssetResult(done) },
        (msg)  => { setPolling(false); setError(msg) },
      )
    } catch (err) {
      setLoading(false)
      setError(err.message)
    }
  }

  if (loadingP) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={24} className="animate-spin text-pink-400 mr-2" />
        Chargement des produits…
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <Package size={36} className="text-gray-200" />
        <p className="text-sm font-medium text-gray-600">Aucun produit dans votre catalogue</p>
        <p className="text-xs text-gray-400">Ajoutez d'abord un produit pour générer un flyer.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          Sélectionner un produit
        </label>
        <select
          value={productId}
          onChange={e => setProductId(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 transition"
        >
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-pink-50 border border-pink-100 rounded-xl px-4 py-3 text-xs text-pink-700 flex gap-2">
        <AlertCircle size={14} className="shrink-0 mt-0.5 text-pink-400" />
        <span>L'IA génère un flyer promotionnel avec le nom, le prix et la photo de votre produit. Le rendu utilise Pillow — résultat disponible en quelques secondes.</span>
      </div>

      {error && (
        <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!productId || loading || polling}
        className="w-full flex items-center justify-center gap-2 py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition"
      >
        {(loading || polling) ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
        {loading ? 'Envoi…' : polling ? 'Génération en cours…' : 'Générer le flyer'}
      </button>
    </form>
  )
}

// ─── Vidéo Coming Soon (V2) ───────────────────────────────────────────────────

function VideoComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed bg-amber-50 border-amber-200">
      <Film size={36} className="text-amber-400 mb-3" />
      <p className="text-sm font-bold text-amber-600">Génération vidéo — Version 2.0</p>
      <p className="text-xs text-gray-400 mt-1">Cette fonctionnalité sera disponible dans la prochaine mise à jour majeure.</p>
      <span className="mt-3 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">V2 — Bientôt</span>
    </div>
  )
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function Studio() {
  const navigate = useNavigate()
  const [quota,         setQuota]         = useState(null)
  const [assets,        setAssets]        = useState([])
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [activeTab,     setActiveTab]     = useState('text')
  const [result,        setResult]        = useState(null)  // { type, text?, url?, filename? }
  const [history,       setHistory]       = useState([])

  useEffect(() => {
    const ctrl = new AbortController()
    Promise.all([
      studioService.quota(ctrl.signal).catch(() => null),
      studioService.assets(ctrl.signal).catch(() => []),
    ]).then(([q, a]) => {
      setQuota(q)
      setAssets(Array.isArray(a) ? a : (a?.results ?? []))
    }).finally(() => setLoadingAssets(false))
    return () => ctrl.abort()
  }, [])

  const handleResult = (entry) => {
    setResult({ type: 'text', text: entry.text })
    setHistory(h => [entry, ...h].slice(0, MAX_HISTORY))
  }

  const handleAssetResult = (asset) => {
    const url = asset.generated_file || asset.generated_url
    setResult({ type: asset.type, url, filename: `afrisell-${asset.type}-${asset.id.slice(0, 8)}.png` })
    setAssets(prev => [asset, ...prev])
  }

  const handleRestore = (h) => {
    setResult({ type: 'text', text: h.text })
    setActiveTab('text')
  }

  const useInPublication = () => {
    sessionStorage.setItem('studio_prefill', result?.text ?? '')
    navigate('/publications')
  }

  const deleteAsset = async (id) => {
    if (!confirm('Supprimer cet asset ?')) return
    try {
      await studioService.deleteAsset(id)
      setAssets(a => a.filter(x => x.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={22} className="text-purple-500" /> Studio IA
          </h1>
          <p className="text-gray-500 text-sm mt-1">Générez du contenu marketing optimisé pour l'Afrique.</p>
        </div>
        <QuotaBadge quota={quota} />
      </div>

      {/* Tabs principaux */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {CONTENT_TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition
                ${activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Contenu principal : formulaire + résultat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Panneau gauche : formulaire */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {activeTab === 'text' && (
            <>
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Wand2 size={16} className="text-purple-500" /> Génération de texte
              </h2>
              <TextForm
                onResult={handleResult}
                onQuotaUpdate={() => setQuota(prev => prev ? { ...prev, used: prev.used + 1 } : prev)}
              />
            </>
          )}
          {activeTab === 'image' && (
            <>
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Image size={16} className="text-blue-500" /> Suppression de fond
              </h2>
              <ImageForm onAssetResult={handleAssetResult} />
            </>
          )}
          {activeTab === 'flyer' && (
            <>
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <LayoutTemplate size={16} className="text-pink-500" /> Génération de flyer
              </h2>
              <FlyerForm onAssetResult={handleAssetResult} />
            </>
          )}
          {activeTab === 'video' && <VideoComingSoon />}
        </div>

        {/* Panneau droit : résultat */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Résultat</h2>
            {result?.type === 'text' && result.text && <CopyButton text={result.text} />}
          </div>

          {result?.type === 'text' && result.text ? (
            <>
              <div className="flex-1 bg-gray-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap overflow-y-auto mb-4 min-h-[180px]">
                {result.text}
              </div>
              <button
                onClick={useInPublication}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-green-500 text-green-600 hover:bg-green-50 text-sm font-semibold rounded-xl transition"
              >
                <Send size={14} />
                Créer une publication avec ce texte
              </button>
            </>
          ) : result?.url ? (
            <>
              <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden mb-4 min-h-[180px]">
                <img src={result.url} alt="résultat" className="max-h-64 max-w-full object-contain rounded-lg" />
              </div>
              <a
                href={result.url}
                download={result.filename ?? 'afrisell-asset.png'}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 text-sm font-semibold rounded-xl transition"
              >
                <Download size={14} />
                Télécharger l'image
              </a>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 text-sm min-h-[180px] gap-2">
              <Wand2 size={28} className="text-gray-200" />
              Le résultat apparaîtra ici
            </div>
          )}
        </div>
      </div>

      {/* Historique */}
      <div className="mb-6">
        <HistoryPanel
          history={history}
          onRestore={handleRestore}
          onClear={() => setHistory([])}
        />
      </div>

      {/* Assets générés */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Assets créés</h2>
          <span className="text-xs text-gray-400">{assets.length} asset{assets.length !== 1 ? 's' : ''}</span>
        </div>
        {loadingAssets ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="text-purple-400 animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ImageOff size={36} className="mb-2 text-gray-200" />
            <p className="text-sm">Aucun asset généré pour l'instant.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
            {assets.map(a => (
              <div key={a.id} className="group relative rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
                {a.file_url ? (
                  <img src={a.file_url} alt={a.name} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center p-4 text-xs text-gray-400 text-center leading-relaxed">
                    {a.content_text || a.type}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button onClick={() => deleteAsset(a.id)}
                    className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-50 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="px-2 py-1.5 border-t border-gray-100 bg-white">
                  <p className="text-xs font-medium text-gray-700 truncate">{a.name || a.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
