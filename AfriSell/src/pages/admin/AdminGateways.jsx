import { useState, useEffect } from 'react'
import { CreditCard, Smartphone, CheckCircle2, AlertTriangle, Loader2, Zap } from 'lucide-react'
import { adminService } from '../../services/adminService'

/* ── Icônes providers ─────────────────────────────────────────────────────── */
const ICONS = {
  google_pay: () => (
    <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="white" stroke="#E2E8F0" strokeWidth="1.5"/>
      <text x="24" y="21" textAnchor="middle" fill="#4285F4" fontSize="9" fontWeight="800" fontFamily="system-ui">G</text>
      <text x="24" y="31" textAnchor="middle" fill="#3C4043" fontSize="8" fontWeight="600" fontFamily="system-ui">Pay</text>
      <circle cx="9" cy="41" r="3.5" fill="#EA4335"/>
      <circle cx="17" cy="41" r="3.5" fill="#FBBC04"/>
      <circle cx="25" cy="41" r="3.5" fill="#34A853"/>
      <circle cx="33" cy="41" r="3.5" fill="#4285F4"/>
    </svg>
  ),
  stripe: () => (
    <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#635BFF"/>
      <path d="M23 19.2c0-1.2.9-1.7 2.4-1.7 2.2 0 5 .7 7.2 2V14c-2.4-1-4.8-1.4-7.2-1.4-5.9 0-9.8 3.1-9.8 8.3 0 8 11 6.7 11 10.2 0 1.4-1.2 1.9-2.9 1.9-2.5 0-5.7-1-8.2-2.4V36c2.7 1.2 5.6 1.8 8.2 1.8 6 0 10.2-3 10.2-8.3-.1-8.7-11.1-7.2-10.9-10.3z" fill="white"/>
    </svg>
  ),
  cinetpay: () => (
    <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#CC1B0E"/>
      <rect x="10" y="16" width="28" height="5" rx="2.5" fill="white"/>
      <rect x="10" y="23" width="28" height="5" rx="2.5" fill="white" opacity="0.65"/>
      <rect x="10" y="30" width="18" height="5" rx="2.5" fill="white" opacity="0.35"/>
    </svg>
  ),
  paystack: () => (
    <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#011B33"/>
      <rect x="9" y="14" width="30" height="5" rx="2.5" fill="#00C3F7"/>
      <rect x="9" y="21.5" width="30" height="5" rx="2.5" fill="#00C3F7" opacity="0.65"/>
      <rect x="9" y="29" width="20" height="5" rx="2.5" fill="#00C3F7" opacity="0.35"/>
    </svg>
  ),
}

const TYPE_ICONS = {
  google_pay: <CreditCard size={13} />,
  stripe:     <CreditCard size={13} />,
  cinetpay:   <Smartphone size={13} />,
  paystack:   <Smartphone size={13} />,
}

const ACCENT = {
  google_pay: 'border-blue-200 bg-blue-50/40',
  stripe:     'border-indigo-200 bg-indigo-50/40',
  cinetpay:   'border-red-200 bg-red-50/40',
  paystack:   'border-cyan-200 bg-cyan-50/40',
}

/* ── Carte passerelle ─────────────────────────────────────────────────────── */
function GatewayCard({ gw, onToggle, toggling }) {
  const Icon      = ICONS[gw.provider] || (() => <CreditCard size={32} />)
  const TypeIcon  = TYPE_ICONS[gw.provider]
  const accent    = gw.is_enabled ? (ACCENT[gw.provider] || 'border-emerald-200 bg-emerald-50/40') : 'border-gray-100 bg-white'
  const canEnable = gw.is_configured || gw.is_enabled

  return (
    <div className={`rounded-2xl border-2 p-5 transition-all duration-200 ${accent}`}>

      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <Icon />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-[15px] leading-tight">{gw.label}</h3>
              {TypeIcon && (
                <span className="text-gray-400">{TypeIcon}</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug max-w-[180px]">{gw.description}</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => onToggle(gw.provider, !gw.is_enabled)}
          disabled={toggling === gw.provider || !canEnable}
          title={!gw.is_configured && !gw.is_enabled ? 'Configurez les clés API d\'abord' : ''}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
            gw.is_enabled ? 'bg-gray-900' : 'bg-gray-200'
          }`}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
            gw.is_enabled ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {gw.is_configured ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-full">
            <CheckCircle2 size={11} /> Clés configurées
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-white border border-amber-200 px-2.5 py-1 rounded-full">
            <AlertTriangle size={11} /> Clés manquantes
          </span>
        )}

        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
          gw.is_enabled
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {toggling === gw.provider
            ? <><Loader2 size={10} className="animate-spin" /> Mise à jour…</>
            : gw.is_enabled ? <><Zap size={10} /> Actif</> : 'Inactif'
          }
        </span>
      </div>

      {/* Variables requises */}
      {!gw.is_configured && (
        <div className="mt-3.5 p-3 bg-white/80 rounded-xl border border-gray-200">
          <p className="text-[11px] text-gray-500 font-semibold mb-1.5">
            À ajouter dans <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">.env</code> :
          </p>
          <div className="space-y-1">
            {gw.required_vars.map(v => (
              <code key={v} className="block text-[11px] text-gray-600 font-mono">
                {v}<span className="text-gray-300">=...</span>
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Page principale ──────────────────────────────────────────────────────── */
export default function AdminGateways() {
  const [gateways, setGateways] = useState([])
  const [loading, setLoading]   = useState(true)
  const [toggling, setToggling] = useState(null)
  const [error, setError]       = useState('')

  useEffect(() => {
    adminService.listGateways()
      .then(setGateways)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (provider, newValue) => {
    setToggling(provider)
    setError('')
    try {
      await adminService.toggleGateway(provider, newValue)
      setGateways(prev => prev.map(g =>
        g.provider === provider ? { ...g, is_enabled: newValue } : g
      ))
    } catch (e) {
      setError(e.message)
    } finally {
      setToggling(null)
    }
  }

  const activeCount = gateways.filter(g => g.is_enabled).length

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1.5">
          <CreditCard size={20} className="text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900">Passerelles de paiement</h1>
        </div>
        <p className="text-sm text-gray-500">
          Active les modes de paiement disponibles dans le checkout.
          {gateways.length > 0 && (
            <span className="ml-1 font-semibold text-gray-700">
              {activeCount} actif{activeCount > 1 ? 's' : ''} sur {gateways.length}
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="text-gray-300 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {gateways.map(gw => (
              <GatewayCard
                key={gw.provider}
                gw={gw}
                onToggle={handleToggle}
                toggling={toggling}
              />
            ))}
          </div>

          <div className="mt-5 flex items-start gap-2 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-base mt-0.5">💡</span>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pour activer une passerelle : ajoutez les clés dans{' '}
              <code className="bg-gray-200 px-1 py-0.5 rounded font-mono text-gray-700">backend/.env</code>,
              redémarrez le serveur, puis activez avec le toggle.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
