import { useState, useEffect } from 'react';
import {
  Check, Zap, Crown, Star, CreditCard, Clock,
  AlertCircle, Loader2, Bot, Sparkles, BarChart2,
  Package, Send,
} from 'lucide-react';

import { useAuth } from '../../context/useAuth';
import { productService } from '../../services/productService';
import { api } from '../../services/api';
import GatewaySelect from './GatewaySelect';

/* ── Définition des 3 plans ─────────────────────────────────────────────────── */
const PLANS = [
  {
    slug: 'starter',
    name: 'Starter',
    icon: Star,
    color: 'green',
    price_africa: 5,
    price_global: 10,
    tagline: 'Pour démarrer votre boutique',
    features: [
      { ok: true,  label: '30 produits'                         },
      { ok: true,  label: 'Bot WhatsApp (réponse auto)'         },
      { ok: true,  label: '30 commandes / mois'                 },
      { ok: true,  label: 'Studio IA — 20 textes + 10 flyers'  },
      { ok: false, label: 'Vidéo IA'                           },
      { ok: false, label: 'Suppression de fond'                 },
      { ok: false, label: 'Publication automatique réseaux'     },
      { ok: false, label: 'Analytics & statistiques'            },
      { ok: false, label: 'Analyse de marché IA'               },
    ],
  },
  {
    slug: 'pro',
    name: 'Pro',
    icon: Zap,
    color: 'blue',
    price_africa: 20,
    price_global: 20,
    tagline: 'Pour les vendeurs qui accélèrent',
    popular: true,
    features: [
      { ok: true,  label: '100 produits'                             },
      { ok: true,  label: 'Bot WhatsApp complet (commandes + GPS)'   },
      { ok: true,  label: 'Commandes illimitées'                     },
      { ok: true,  label: 'Studio IA illimité (texte + flyers)'     },
      { ok: true,  label: '10 vidéos IA / mois'                     },
      { ok: true,  label: 'Suppression de fond'                      },
      { ok: true,  label: 'Publication automatique réseaux sociaux'  },
      { ok: true,  label: 'Analytics & statistiques de ventes'       },
      { ok: false, label: 'Analyse de marché IA'                    },
    ],
  },
  {
    slug: 'business',
    name: 'Business',
    icon: Crown,
    color: 'purple',
    price_africa: 50,
    price_global: 50,
    tagline: 'Pour les entreprises et équipes',
    features: [
      { ok: true, label: 'Produits illimités'                            },
      { ok: true, label: 'Bot WhatsApp IA avancé (tout automatisé)'     },
      { ok: true, label: 'Commandes illimitées'                          },
      { ok: true, label: 'Studio IA illimité (texte + flyers + vidéos)' },
      { ok: true, label: 'Vidéos IA illimitées'                         },
      { ok: true, label: 'Suppression de fond'                           },
      { ok: true, label: 'Publication auto + smart schedule'             },
      { ok: true, label: 'Analytics avancées'                            },
      { ok: true, label: 'Analyse de marché IA'                         },
    ],
  },
];

const COLORS = {
  green:  {
    badge:  'bg-green-100 text-green-700',
    btn:    'bg-green-600 hover:bg-green-700',
    border: 'border-green-400',
    bg:     'bg-green-50',
    icon:   'text-green-600',
  },
  blue: {
    badge:  'bg-blue-100 text-blue-700',
    btn:    'bg-blue-600 hover:bg-blue-700',
    border: 'border-blue-400',
    bg:     'bg-blue-50',
    icon:   'text-blue-600',
  },
  purple: {
    badge:  'bg-purple-100 text-purple-700',
    btn:    'bg-purple-600 hover:bg-purple-700',
    border: 'border-purple-400',
    bg:     'bg-purple-50',
    icon:   'text-purple-600',
  },
};

/* ── Page principale ─────────────────────────────────────────────────────────── */
export default function Billing() {
  const { user, isFree } = useAuth();
  const [productCount, setProductCount] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  // Détection région Afrique (basé sur le pays du profil ou fuseau horaire)
  const AFRICA_CODES = ['CI', 'SN', 'ML', 'BF', 'GN', 'TG', 'BJ', 'NE', 'CM', 'GH', 'NG', 'CD', 'MG', 'RW', 'KE', 'TZ', 'ET'];
  const isAfrica = AFRICA_CODES.includes(user?.country?.toUpperCase() ?? '');

  const currentSlug = user?.plan || (isFree ? 'free' : 'starter');

  useEffect(() => {
    productService.list()
      .then((data) => setProductCount(data.length))
      .catch(() => setProductCount(0))
      .finally(() => setLoadingUsage(false));
  }, []);

  const USAGE_ICONS = [
    { icon: Package,  label: 'Produits' },
    { icon: Bot,      label: 'Bot SIRA' },
    { icon: Sparkles, label: 'Studio IA' },
    { icon: BarChart2,label: 'Analytics' },
    { icon: Send,     label: 'Publications' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 pt-2 md:pt-0">
        <h1 className="text-2xl font-black text-gray-900">Facturation & Abonnement</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gérez votre plan et accédez à toutes les fonctionnalités.</p>
      </div>

      {/* Plan actuel */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 flex items-center gap-4 shadow-sm">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFree ? 'bg-amber-100' : 'bg-green-100'}`}>
          <Zap size={18} className={isFree ? 'text-amber-500' : 'text-green-600'} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900">
            Plan actuel :{' '}
            <span className={`capitalize ${isFree ? 'text-amber-600' : 'text-green-600'}`}>
              {isFree ? 'Gratuit' : (user?.plan ?? 'Starter')}
            </span>
          </p>
          {isFree ? (
            <p className="text-xs text-amber-500 mt-0.5">
              Accès limité — passez à un plan payant pour débloquer toutes les fonctionnalités
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock size={11} /> Abonnement actif
            </p>
          )}
        </div>
        {!isFree && (
          <button
            onClick={() => api.post('/api/billing/stripe/portal/', {})
              .then(r => r?.url && (window.location.href = r.url))
              .catch(() => {})}
            className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition font-medium"
          >
            Gérer l'abonnement
          </button>
        )}
      </div>

      {/* Usage produits */}
      {isFree && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm text-amber-800 mb-3">Utilisation — Plan Gratuit</p>
            {loadingUsage ? (
              <div className="flex items-center gap-2 text-sm text-amber-500">
                <Loader2 size={14} className="animate-spin" /> Chargement…
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="flex justify-between text-xs text-amber-700 mb-1">
                    <span>Produits</span>
                    <span className="font-bold">{productCount ?? 0}/3</span>
                  </div>
                  <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${(productCount ?? 0) >= 3 ? 'bg-red-500' : 'bg-amber-400'}`}
                      style={{ width: `${Math.min(((productCount ?? 0) / 3) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                {USAGE_ICONS.slice(1).map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-amber-700">
                    <Icon size={13} />
                    <span>{label}</span>
                    <span className="ml-auto font-bold text-red-500">Non disponible</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info région */}
      {isAfrica && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
          <span className="text-lg">🌍</span>
          <span>
            <strong>Prix Afrique détecté</strong> — vous bénéficiez des tarifs réduits pour l'Afrique.
          </span>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {PLANS.map((plan) => {
          const c         = COLORS[plan.color];
          const Icon      = plan.icon;
          const price     = isAfrica ? plan.price_africa : plan.price_global;
          const isCurrent = plan.slug === currentSlug;

          return (
            <div
              key={plan.slug}
              className={`bg-white rounded-2xl border-2 p-6 flex flex-col shadow-sm transition-all hover:-translate-y-1 hover:shadow-md
                ${isCurrent ? c.border : plan.popular ? 'border-blue-200' : 'border-gray-100'}`}
            >
              {plan.popular && !isCurrent && (
                <div className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold w-fit mb-3">
                  ⭐ Populaire
                </div>
              )}
              {isCurrent && (
                <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold w-fit mb-3 ${c.badge}`}>
                  ✓ Plan actuel
                </div>
              )}

              <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={c.icon} />
              </div>

              <h3 className="font-black text-gray-900 text-lg">{plan.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5 mb-4">{plan.tagline}</p>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">{price}</span>
                  <span className="text-gray-400 text-sm">$/mois</span>
                </div>
                {isAfrica && plan.price_africa !== plan.price_global && (
                  <p className="text-xs text-green-600 font-semibold mt-0.5">
                    Prix Afrique · {plan.price_global}$ ailleurs
                  </p>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f) => (
                  <li key={f.label} className={`flex items-start gap-2 text-sm ${f.ok ? 'text-gray-700' : 'text-gray-300'}`}>
                    <Check size={14} className={`shrink-0 mt-0.5 ${f.ok ? 'text-green-500' : 'text-gray-200'}`} />
                    {f.label}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrent && setCheckoutPlan(plan)}
                disabled={isCurrent}
                className={`w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2
                  ${isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : `${c.btn} text-white active:scale-[0.98]`}`}
              >
                {isCurrent ? 'Plan actuel' : <><CreditCard size={14} /> Choisir ce plan</>}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 max-w-3xl">
        Sans engagement · Annulation à tout moment ·
        Paiement sécurisé par Stripe / Paystack / CinetPay
      </p>

      {checkoutPlan && (
        <GatewaySelect
          plan={checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
        />
      )}
    </div>
  );
}
