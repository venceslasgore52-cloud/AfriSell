import { useState, useEffect } from 'react'
import { CreditCard, Smartphone, Loader2, X, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { api } from '../../services/api'

/* ── Icônes providers ─────────────────────────────────────────────────────── */
function CardIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#0F172A"/>
      <rect x="7" y="14" width="34" height="22" rx="4" fill="#1E293B"/>
      <rect x="7" y="20" width="34" height="6" fill="#3B82F6"/>
      <rect x="10" y="30" width="10" height="2.5" rx="1.25" fill="white" opacity="0.7"/>
      <rect x="22" y="30" width="6" height="2.5" rx="1.25" fill="white" opacity="0.4"/>
      <rect x="30" y="30" width="4" height="2.5" rx="1.25" fill="white" opacity="0.3"/>
      <rect x="10" y="16" width="7" height="5" rx="1.5" fill="#FBBF24" opacity="0.9"/>
    </svg>
  )
}

function StripeIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#635BFF"/>
      <path d="M23 19.2c0-1.2.9-1.7 2.4-1.7 2.2 0 5 .7 7.2 2V14c-2.4-1-4.8-1.4-7.2-1.4-5.9 0-9.8 3.1-9.8 8.3 0 8 11 6.7 11 10.2 0 1.4-1.2 1.9-2.9 1.9-2.5 0-5.7-1-8.2-2.4V36c2.7 1.2 5.6 1.8 8.2 1.8 6 0 10.2-3 10.2-8.3-.1-8.7-11.1-7.2-10.9-10.3z" fill="white"/>
    </svg>
  )
}

function CinetPayIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#CC1B0E"/>
      <circle cx="24" cy="24" r="11" fill="white" opacity="0.15"/>
      <path d="M24 13C18 13 13 18 13 24s5 11 11 11 11-5 11-11-5-11-11-11zm0 19c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="white" opacity="0.8"/>
      <path d="M27.5 20.5h-7a.5.5 0 000 1h7a.5.5 0 000-1zm0 3.5h-7a.5.5 0 000 1h7a.5.5 0 000-1zm-2 3.5h-5a.5.5 0 000 1h5a.5.5 0 000-1z" fill="white"/>
      <text x="24" y="27" textAnchor="middle" fill="white" fontSize="9" fontWeight="800" fontFamily="system-ui">CP</text>
    </svg>
  )
}

function GooglePayIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="white" stroke="#E2E8F0" strokeWidth="1.5"/>
      <text x="24" y="19" textAnchor="middle" fill="#4285F4" fontSize="8" fontWeight="800" fontFamily="'Google Sans', system-ui">G</text>
      <text x="24" y="29" textAnchor="middle" fill="#3C4043" fontSize="7.5" fontWeight="600" fontFamily="'Google Sans', system-ui">Pay</text>
      <circle cx="10" cy="37" r="3.5" fill="#EA4335"/>
      <circle cx="18" cy="37" r="3.5" fill="#FBBC04"/>
      <circle cx="26" cy="37" r="3.5" fill="#34A853"/>
      <circle cx="34" cy="37" r="3.5" fill="#4285F4"/>
    </svg>
  )
}

function PaystackIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#011B33"/>
      <rect x="9" y="14" width="30" height="5" rx="2.5" fill="#00C3F7"/>
      <rect x="9" y="21.5" width="30" height="5" rx="2.5" fill="#00C3F7" opacity="0.65"/>
      <rect x="9" y="29" width="20" height="5" rx="2.5" fill="#00C3F7" opacity="0.35"/>
    </svg>
  )
}

/* ── Config providers ─────────────────────────────────────────────────────── */
const AFRICA_CODES = ['CI','SN','ML','BF','GN','TG','BJ','NE','CM','GH','NG','CD','MG','RW','KE','TZ','ET']

const GATEWAYS = (isAfrica) => [
  {
    id:         'carte_bancaire',
    label:      'Carte bancaire',
    subtitle:   'Visa · Mastercard · AMEX',
    icon:       <CardIcon />,
    badge:      isAfrica ? null : 'Recommandé',
    badgeColor: 'bg-blue-50 text-blue-600 border border-blue-200',
    methods:    ['Visa', 'Mastercard', 'American Express'],
    color:      '#3B82F6',
    typeIcon:   <CreditCard size={15} />,
  },
  {
    id:       'stripe',
    label:    'Stripe Checkout',
    subtitle: 'Paiement international sécurisé',
    icon:     <StripeIcon />,
    badge:    null,
    methods:  ['Visa', 'Mastercard', 'SEPA', 'Link'],
    color:    '#635BFF',
    typeIcon: <CreditCard size={15} />,
  },
  {
    id:         'cinetpay',
    label:      'CinetPay',
    subtitle:   'Mobile Money · CI, SN, ML, BF…',
    icon:       <CinetPayIcon />,
    badge:      isAfrica ? 'Recommandé' : null,
    badgeColor: 'bg-orange-50 text-orange-600 border border-orange-200',
    methods:    ['Orange Money', 'MTN MoMo', 'Wave', 'Moov Money'],
    color:      '#CC1B0E',
    typeIcon:   <Smartphone size={15} />,
  },
  {
    id:         'paystack',
    label:      'Paystack',
    subtitle:   'Mobile Money · NG, GH, KE, ZA…',
    icon:       <PaystackIcon />,
    badge:      isAfrica ? 'Recommandé' : null,
    badgeColor: 'bg-cyan-50 text-cyan-600 border border-cyan-200',
    methods:    ['Mobile Money', 'Carte', 'USSD', 'Virement'],
    color:      '#00C3F7',
    typeIcon:   <Smartphone size={15} />,
  },
  {
    id:       'google_pay',
    label:    'Google Pay',
    subtitle: 'Payer en 1 clic avec Google',
    icon:     <GooglePayIcon />,
    badge:    null,
    methods:  ['Google Pay', 'Visa', 'Mastercard'],
    color:    '#4285F4',
    typeIcon: <CreditCard size={15} />,
  },
]

/* ── Composant principal ──────────────────────────────────────────────────── */
export default function GatewaySelect({ plan, onClose }) {
  const { user } = useAuth()
  const isAfrica    = AFRICA_CODES.includes(user?.country?.toUpperCase() ?? '')
  const price       = isAfrica ? plan.price_africa : plan.price_global
  const allGateways = GATEWAYS(isAfrica)

  const [enabledProviders, setEnabledProviders] = useState([])
  const [selected, setSelected]                 = useState(null)
  const [loading, setLoading]                   = useState(false)
  const [fetchingGw, setFetchingGw]             = useState(true)
  const [error, setError]                       = useState('')

  useEffect(() => {
    api.get('/api/billing/gateways/')
      .then(data => {
        const providers = Array.isArray(data) ? data : []
        const active = providers.length
          ? providers
          : ['carte_bancaire', 'stripe', 'cinetpay', 'paystack', 'google_pay']
        setEnabledProviders(active)
        const prefer = isAfrica
          ? ['cinetpay', 'paystack', 'carte_bancaire', 'stripe', 'google_pay']
          : ['google_pay', 'carte_bancaire', 'stripe']
        setSelected(prefer.find(p => active.includes(p)) || active[0] || null)
      })
      .catch(() => {
        const fallback = ['carte_bancaire', 'stripe', 'cinetpay', 'paystack', 'google_pay']
        setEnabledProviders(fallback)
        setSelected(isAfrica ? 'cinetpay' : 'google_pay')
      })
      .finally(() => setFetchingGw(false))
  }, [isAfrica])

  const gateways = allGateways.filter(g => enabledProviders.includes(g.id))
  const activeGateway = gateways.find(g => g.id === selected)

  const handlePay = async () => {
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/billing/checkout/', {
        plan_slug: plan.slug,
        provider:  selected,
      })
      if (res?.checkout_url) {
        window.location.href = res.checkout_url
      } else {
        setError('Lien de paiement non reçu. Veuillez réessayer.')
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du paiement.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh]">

        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-4">
          {/* Drag handle (mobile) */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Abonnement
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                Plan {plan.name}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                <span className="font-bold text-gray-900">{price} $</span>
                {' '}/ mois · Sans engagement
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-700 shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {isAfrica && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-base">🌍</span>
              <span className="text-xs text-emerald-700 font-medium">
                Prix Afrique appliqué — tarif préférentiel
              </span>
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100 mx-5" />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Mode de paiement
          </p>

          {fetchingGw ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={22} className="animate-spin text-gray-300" />
            </div>
          ) : (
            <div className="space-y-2 mb-5">
              {gateways.map((gw) => {
                const isSelected = selected === gw.id
                return (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setSelected(gw.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all text-left
                      ${isSelected
                        ? 'border-gray-900 bg-gray-900 shadow-lg'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/70'
                      }`}
                  >
                    <div className="shrink-0">{gw.icon}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {gw.label}
                        </span>
                        {gw.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white border border-white/30'
                              : gw.badgeColor
                          }`}>
                            {gw.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                        {gw.subtitle}
                      </p>
                    </div>

                    <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-white bg-white' : 'border-gray-200'
                    }`}>
                      {isSelected && <CheckCircle2 size={14} className="text-gray-900" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Méthodes acceptées */}
          {activeGateway?.methods && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Méthodes acceptées
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeGateway.methods.map((m) => (
                  <span key={m} className="inline-flex items-center text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1 rounded-lg font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Récap */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Plan {plan.name}</span>
              <span className="text-base font-black text-gray-900">{price} $ / mois</span>
            </div>
            <div className="h-px bg-gray-200 mb-2" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Facturation mensuelle</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={11} /> Annulation libre
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 pb-6 pt-3 border-t border-gray-100">
          <button
            onClick={handlePay}
            disabled={loading || !selected || fetchingGw}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-2xl transition active:scale-[0.98] shadow-lg shadow-gray-900/20"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Redirection en cours…</>
              : <><Lock size={14} /> Payer {price} $ / mois</>
            }
          </button>

          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>Paiement sécurisé · Chiffrement SSL 256-bit</span>
          </div>
        </div>

      </div>
    </div>
  )
}
