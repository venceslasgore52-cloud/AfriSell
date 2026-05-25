import { useState, useEffect } from 'react'
import { Bot, MessageCircle, Loader2, Settings, Save, CheckCircle, Users, TrendingUp, Clock } from 'lucide-react'
import { siraService } from '../../services/siraService'

const STATUS_STYLE = {
  active:   'bg-green-100 text-green-700',
  closed:   'bg-gray-100 text-gray-500',
  pending:  'bg-amber-100 text-amber-700',
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={17} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
    </div>
  )
}

export default function Conversations() {
  const [tab, setTab] = useState('conversations')
  const [conversations, setConversations] = useState([])
  const [stats, setStats] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const ctrl = new AbortController()
    Promise.all([
      siraService.conversations(ctrl.signal),
      siraService.stats(ctrl.signal).catch(() => null),
      siraService.config(ctrl.signal).catch(() => null),
    ])
      .then(([convData, statsData, configData]) => {
        setConversations(Array.isArray(convData) ? convData : (convData?.results ?? []))
        setStats(statsData)
        setConfig(configData)
      })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [])

  const saveConfig = async (e) => {
    e.preventDefault()
    setSavingConfig(true)
    try {
      await siraService.updateConfig(config)
      setConfigSaved(true)
      setTimeout(() => setConfigSaved(false), 3000)
    } catch (err) {
      alert(err.message)
    } finally {
      setSavingConfig(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot size={22} className="text-green-600" /> Bot Client (SIRA)
          </h1>
          <p className="text-gray-500 text-sm mt-1">Votre assistant IA WhatsApp pour gérer vos clients.</p>
        </div>
        {!loading && config && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              config.is_active
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${config.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {config.is_active ? `${config.bot_name || 'SIRA'} actif` : `${config.bot_name || 'SIRA'} inactif`}
            </span>
            {config.wa_provider && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-full border border-gray-200">
                {config.wa_provider === 'twilio' ? 'Twilio' : config.wa_provider === 'meta' ? 'Meta Cloud API' : 'WA Bridge'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Users}     label="Clients servis"      value={stats.total_clients}      color="bg-blue-100 text-blue-600" />
          <StatCard icon={TrendingUp} label="Commandes via bot"  value={stats.orders_via_bot}     color="bg-green-100 text-green-600" />
          <StatCard icon={Clock}     label="Temps de réponse"    value={stats.avg_response_time}  color="bg-purple-100 text-purple-600" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {[{ id: 'conversations', label: 'Conversations', icon: MessageCircle }, { id: 'config', label: 'Configuration', icon: Settings }].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {error && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      {/* Conversations */}
      {tab === 'conversations' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="text-green-500 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <MessageCircle size={40} className="mb-3 text-gray-200" />
              <p className="text-sm font-medium">Aucune conversation pour l'instant</p>
              <p className="text-xs mt-1">Les conversations WhatsApp apparaîtront ici.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {conversations.map(c => (
                <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-green-700">
                      {c.client_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 truncate">{c.client_display || c.client_name || c.client_phone}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {c.status === 'active' ? 'Active' : c.status === 'pending' ? 'En attente' : 'Fermée'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 truncate mt-0.5">{c.last_message || '—'}</div>
                  </div>
                  <div className="text-xs text-gray-300 shrink-0">
                    {c.updated_at ? new Date(c.updated_at).toLocaleDateString('fr-FR') : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Configuration */}
      {tab === 'config' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-green-400 animate-spin" />
            </div>
          ) : !config ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Configuration non disponible.
            </div>
          ) : (
            <form onSubmit={saveConfig} className="space-y-5 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom du bot</label>
                <input value={config.bot_name ?? ''} onChange={e => setConfig(c => ({ ...c, bot_name: e.target.value }))} className={inputCls} placeholder="SIRA" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message d'accueil</label>
                <textarea
                  value={config.welcome_message ?? ''} rows={3}
                  onChange={e => setConfig(c => ({ ...c, welcome_message: e.target.value }))}
                  className={`${inputCls} resize-none`}
                  placeholder="Bonjour ! Je suis votre assistant…"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Langue principale</label>
                <select value={config.language ?? 'fr'} onChange={e => setConfig(c => ({ ...c, language: e.target.value }))} className={inputCls}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="wo">Wolof</option>
                  <option value="dioula">Dioula</option>
                </select>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox" id="active" checked={config.is_active ?? false}
                  onChange={e => setConfig(c => ({ ...c, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-green-600"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">Bot actif</label>
              </div>
              <button
                type="submit" disabled={savingConfig}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition"
              >
                {savingConfig ? <Loader2 size={14} className="animate-spin" /> : configSaved ? <CheckCircle size={14} /> : <Save size={14} />}
                {configSaved ? 'Enregistré !' : 'Enregistrer'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
