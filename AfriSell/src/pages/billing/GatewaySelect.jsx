import { useState, useEffect } from 'react'
import { CreditCard, Smartphone, Loader2, X, ShieldCheck, Lock } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { api } from '../../services/api'

/* ── Icônes providers ─────────────────────────────────────────────────────── */
function CardIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#1A1A2E"/>
      <rect x="6" y="12" width="28" height="18" rx="3" fill="#16213E" stroke="#E94560" strokeWidth="1"/>
      <rect x="6" y="17" width="28" height="5" fill="#E94560" opacity="0.8"/>
      <rect x="8" y="25" width="8" height="2" rx="1" fill="#fff" opacity="0.6"/>
      <rect x="18" y="25" width="5" height="2" rx="1" fill="#fff" opacity="0.4"/>
    </svg>
  )
}
function StripeIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#635BFF"/>
      <path d="M19.2 16.4c0-1 .8-1.4 2.1-1.4 1.9 0 4.2.6 6 1.6V12c-2-.8-4-1.2-6-1.2-4.9 0-8.2 2.6-8.2 6.9 0 6.7 9.2 5.6 9.2 8.5 0 1.2-1 1.6-2.4 1.6-2.1 0-4.8-.9-6.9-2V30c2.3 1 4.7 1.5 6.9 1.5 5 0 8.5-2.5 8.5-6.9-.1-7.3-9.2-6-9.2-8.2z" fill="white"/>
    </svg>
  )
}
function CinetPayIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#E2291B"/>
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">CP</text>
    </svg>
  )
}
function GooglePayIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#fff" stroke="#E8EAED" strokeWidth="1.5"/>
      <text x="20" y="15" textAnchor="middle" fill="#4285F4" fontSize="6" fontWeight="800">G</text>
      <text x="20" y="23" textAnchor="middle" fill="#34A853" fontSize="6" fontWeight="700">Pay</text>
      <circle cx="10" cy="20" r="3" fill="#EA4335"/>
      <circle cx="16" cy="20" r="3" fill="#FBBC05"/>
      <circle cx="22" cy="20" r="3" fill="#4285F4"/>
    </svg>
  )
}
function PaystackIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#00C3F7"/>
      <rect x="8" y="13" width="24" height="4" rx="2" fill="white"/>
      <rect x="8" y="19" width="24" height="4" rx="2" fill="white" opacity="0.7"/>
      <rect x="8" y="25" width="16" height="4" rx="2" fill="white" opacity="0.4"/>
    </svg>
  )
}

/* ── Config des 4 providers ───────────────────────────────────────────────── */
const AFRICA_CODES = ['CI','SN','ML','BF','GN','TG','BJ','NE','CM','GH','NG','CD','MG','RW','KE','TZ','ET']

const GATEWAYS = (isAfrica) => [
  {
    id:         'carte_bancaire',
    label:      'Carte bancaire',
    subtitle:   'Visa · Mastercard · AMEX',
    icon:       <CardIcon />,
    badge:      isAfrica ? null : 'Recommandé',
    badgeColor: 'bg-blue-100 text-blue-700',
    methods:    ['Visa', 'Mastercard', 'American Express'],
    typeIcon:   <CreditCard size={16} />,
  },
  {
    id:       'stripe',
    label:    'Stripe Checkout',
    subtitle: 'Paiement en ligne sécurisé',
    icon:     <StripeIcon />,
    badge:    null,
    methods:  ['Visa', 'Mastercard', 'SEPA', 'Link'],
    typeIcon: <CreditCard size={16} />,
  },
  {
    id:         'cinetpay',
    label:      'CinetPay',
    subtitle:   'Mobile Money Afrique de l\'Ouest',
    icon:       <CinetPayIcon />,
    badge:      isAfrica ? 'Recommandé CI/SN/ML…' : null,
    badgeColor: 'bg-green-100 text-green-700',
    methods:    ['Orange Money', 'MTN Mobile Money', 'Wave', 'Moov Money'],
    typeIcon:   <Smartphone size={16} />,
  },
  {
    id:         'paystack',
    label:      'Paystack',
    subtitle:   'Mobile Money · Nigeria, Ghana, Kenya…',
    icon:       <PaystackIcon />,
    badge:      isAfrica ? 'Recommandé NG/GH/KE' : null,
    badgeColor: 'bg-cyan-100 text-cyan-700',
    methods:    ['Mobile Money', 'Carte', 'USSD', 'Bank'],
    typeIcon:   <Smartphone size={16} />,
  },
  {
    id:       'google_pay',
    label:    'Google Pay',
    subtitle: 'Payer en un clic avec Google',
    icon:     <GooglePayIcon />,
    badge:    null,
    methods:  ['Google Pay', 'Visa', 'Mastercard'],
    typeIcon: <CreditCard size={16} />,
  },
]

/* ── Composant principal ──────────────────────────────────────────────────── */
export default function GatewaySelect({ plan, onClose }) {
  const { user } = useAuth()

  const isAfrica     = AFRICA_CODES.includes(user?.country?.toUpperCase() ?? '')
  const price        = isAfrica ? plan.price_africa : plan.price_global
  const allGateways  = GATEWAYS(isAfrica)

  const [enabledProviders, setEnabledProviders] = useState(['google_pay'])
  const [selected, setSelected] = useState('google_pay')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    api.get('/api/billing/gateways/').then(data => {
      const providers = Array.isArray(data) ? data : []
      setEnabledProviders(providers.length ? providers : ['google_pay'])
      // sélectionne le premier actif pertinent
      const prefer = isAfrica
        ? ['cinetpay', 'paystack', 'google_pay', 'stripe', 'carte_bancaire']
        : ['google_pay', 'carte_bancaire', 'stripe']
      const first = prefer.find(p => providers.includes(p)) || providers[0] || 'google_pay'
      setSelected(first)
    }).catch(() => {})
  }, [isAfrica])

  const gateways = allGateways.filter(g => enabledProviders.includes(g.id))

  const handlePay = async () => {
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
        setError('Lien de paiement non reçu. Réessayez.')
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du paiement.')
    } finally {
      setLoading(false)
    }
  }

  const activeGateway = gateways.find(g => g.id === selected)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <CreditCard size={18} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Passer au plan {plan.name}</h3>
              <p className="text-xs text-gray-400">{price} $/mois · Sans engagement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-400 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {isAfrica && (
            <div className="mb-4 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 flex items-center gap-2">
              <span className="text-base">🌍</span>
              <span><strong>Prix Afrique</strong> — vous bénéficiez des tarifs réduits.</span>
            </div>
          )}

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Choisir le mode de paiement
          </p>

          {/* Liste des 4 providers */}
          <div className="space-y-2.5 mb-5">
            {gateways.map((gw) => (
              <button
                key={gw.id}
                type="button"
                onClick={() => setSelected(gw.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                  ${selected === gw.id
                    ? 'border-green-400 bg-green-50 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                  ${selected === gw.id ? 'border-green-500' : 'border-gray-300'}`}>
                  {selected === gw.id && <div className="w-2 h-2 rounded-full bg-green-500" />}
                </div>

                <div className="shrink-0">{gw.icon}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900">{gw.label}</span>
                    {gw.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gw.badgeColor}`}>
                        {gw.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{gw.subtitle}</p>
                </div>

                <div className="shrink-0 text-gray-300">{gw.typeIcon}</div>
              </button>
            ))}
          </div>

          {/* Méthodes acceptées */}
          {activeGateway?.methods && (
            <div className="mb-5 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 mb-2 font-medium">Méthodes acceptées :</p>
              <div className="flex flex-wrap gap-1.5">
                {activeGateway.methods.map((m) => (
                  <span key={m} className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Récapitulatif */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Plan {plan.name}</span>
              <span className="font-black text-gray-900">{price} $/mois</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Facturation mensuelle</span>
              <span className="text-green-600 font-semibold">Annulation à tout moment</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lock size={11} />
            <span>Paiement sécurisé — données chiffrées SSL</span>
            <ShieldCheck size={11} className="ml-auto text-green-500" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex gap-3 px-6 pb-6 pt-2 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={handlePay}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition active:scale-[0.98]"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Redirection…</>
              : <><CreditCard size={15} /> Payer {price} $/mois</>
            }
          </button>
        </div>

      </div>
    </div>
  )
}
