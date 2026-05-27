import { useState, useEffect } from 'react'
import { CreditCard, Smartphone, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { adminService } from '../../services/adminService'

const PROVIDER_ICONS = {
  google_pay:  () => (
    <svg className="w-7 h-7" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#fff" stroke="#E8EAED" strokeWidth="1.5"/>
      <circle cx="12" cy="20" r="4" fill="#EA4335"/>
      <circle cx="20" cy="20" r="4" fill="#FBBC05"/>
      <circle cx="28" cy="20" r="4" fill="#4285F4"/>
    </svg>
  ),
  stripe: () => (
    <svg className="w-7 h-7" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#635BFF"/>
      <path d="M19.2 16.4c0-1 .8-1.4 2.1-1.4 1.9 0 4.2.6 6 1.6V12c-2-.8-4-1.2-6-1.2-4.9 0-8.2 2.6-8.2 6.9 0 6.7 9.2 5.6 9.2 8.5 0 1.2-1 1.6-2.4 1.6-2.1 0-4.8-.9-6.9-2V30c2.3 1 4.7 1.5 6.9 1.5 5 0 8.5-2.5 8.5-6.9-.1-7.3-9.2-6-9.2-8.2z" fill="white"/>
    </svg>
  ),
  cinetpay: () => (
    <svg className="w-7 h-7" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#E2291B"/>
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">CP</text>
    </svg>
  ),
  paystack: () => (
    <svg className="w-7 h-7" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#FF6B35"/>
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">GP</text>
    </svg>
  ),
}

function GatewayCard({ gw, onToggle, toggling }) {
  const Icon = PROVIDER_ICONS[gw.provider] || (() => <CreditCard size={28} />)

  return (
    <div className={`bg-white rounded-2xl border-2 p-5 transition-all ${
      gw.is_enabled ? 'border-green-200 shadow-sm' : 'border-gray-100'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Icon />
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{gw.label}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{gw.description}</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => onToggle(gw.provider, !gw.is_enabled)}
          disabled={toggling === gw.provider || (!gw.is_configured && !gw.is_enabled)}
          title={!gw.is_configured ? 'Ajoutez les clés API d\'abord' : ''}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
            gw.is_enabled ? 'bg-green-500' : 'bg-gray-200'
          }`}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            gw.is_enabled ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {/* Statut clés API */}
      <div className="flex items-center gap-2 mb-3">
        {gw.is_configured ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            <CheckCircle size={11} /> Clés configurées
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <AlertTriangle size={11} /> Clés manquantes
          </span>
        )}
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          gw.is_enabled ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'
        }`}>
          {gw.is_enabled ? 'Actif' : 'Inactif'}
        </span>
      </div>

      {/* Variables requises */}
      {!gw.is_configured && (
        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-1.5">À ajouter dans <code className="bg-gray-200 px-1 rounded">.env</code> :</p>
          <div className="space-y-1">
            {gw.required_vars.map(v => (
              <code key={v} className="block text-xs text-gray-600 font-mono">{v}=...</code>
            ))}
          </div>
        </div>
      )}

      {toggling === gw.provider && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
          <Loader2 size={11} className="animate-spin" /> Mise à jour…
        </div>
      )}
    </div>
  )
}

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

  const active = gateways.filter(g => g.is_enabled).length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard size={22} className="text-green-600" /> Passerelles de paiement
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Active les modes de paiement disponibles dans le checkout.
          {' '}<span className="font-semibold text-gray-700">{active} actif{active > 1 ? 's' : ''}</span> sur {gateways.length}.
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-green-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gateways.map(gw => (
              <GatewayCard
                key={gw.provider}
                gw={gw}
                onToggle={handleToggle}
                toggling={toggling}
              />
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700 font-medium">
              Pour activer une passerelle : ajoute les clés dans <code className="bg-blue-100 px-1 rounded">/backend/.env</code>,
              redémarre le serveur, puis active ici avec le toggle.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
