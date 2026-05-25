import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Cadre from '../ui/Cadre'

const fadeUp  = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.1 } } }
const scaleIn = { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }

const plans = [
  {
    name:         'Starter',
    priceAfrica:  5,
    priceGlobal:  10,
    desc:         'Pour démarrer votre boutique',
    highlight:    false,
    cta:          "Commencer",
    features: [
      { ok: true,  label: '30 produits' },
      { ok: true,  label: 'Bot WhatsApp (réponse auto)' },
      { ok: true,  label: '50 commandes / mois' },
      { ok: true,  label: 'Studio IA — textes + flyers' },
      { ok: false, label: 'Vidéo IA' },
      { ok: false, label: 'Publication auto réseaux' },
      { ok: false, label: 'Analytics' },
    ],
  },
  {
    name:         'Pro',
    priceAfrica:  20,
    priceGlobal:  20,
    desc:         'Pour les vendeurs qui accélèrent',
    highlight:    true,
    cta:          "Choisir Pro",
    features: [
      { ok: true,  label: '100 produits' },
      { ok: true,  label: 'Bot WhatsApp complet (GPS + commandes)' },
      { ok: true,  label: 'Commandes illimitées' },
      { ok: true,  label: 'Studio IA illimité (texte + flyers)' },
      { ok: true,  label: '10 vidéos IA / mois' },
      { ok: true,  label: 'Publication auto réseaux sociaux' },
      { ok: true,  label: 'Analytics & statistiques' },
    ],
  },
  {
    name:         'Business',
    priceAfrica:  50,
    priceGlobal:  50,
    desc:         'Pour les entreprises et équipes',
    highlight:    false,
    cta:          "Choisir Business",
    features: [
      { ok: true,  label: 'Produits illimités' },
      { ok: true,  label: 'Bot WhatsApp IA avancé' },
      { ok: true,  label: 'Commandes illimitées' },
      { ok: true,  label: 'Studio IA illimité + vidéos illimitées' },
      { ok: true,  label: 'Smart Schedule publications' },
      { ok: true,  label: 'Analytics avancées' },
      { ok: true,  label: 'Analyse de marché IA' },
    ],
  },
]

export default function PlanCadre() {
  const navigate = useNavigate()

  return (
    <section id="pricing" className="py-24 px-4 bg-[#f0f7f1]">
      <div className="max-w-5xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-4">
          <Cadre
            badge="Tarifs"
            title="Simple. Transparent. Sans surprise."
            sub="Des prix adaptés à l'Afrique — sans engagement, annulation à tout moment."
          />
        </motion.div>

        {/* Badge prix Afrique */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="flex justify-center mb-12">
          <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-full border border-green-200">
            🌍 Prix spéciaux pour l&apos;Afrique — jusqu&apos;à 50% moins cher
          </span>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 items-stretch"
        >
          {plans.map(p => (
            <motion.div
              key={p.name}
              variants={scaleIn}
              className={`relative rounded-3xl border p-8 flex flex-col transition-transform ${
                p.highlight
                  ? 'bg-green-500 border-green-400 text-white shadow-2xl shadow-green-300 scale-105'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-700 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  ⭐ Le plus populaire
                </span>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-1 ${p.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {p.name}
                </h3>
                <p className={`text-sm mb-5 ${p.highlight ? 'text-green-100' : 'text-gray-500'}`}>
                  {p.desc}
                </p>

                {/* Prix Afrique */}
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-extrabold ${p.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {p.priceAfrica}$
                  </span>
                  <span className={`text-sm mb-1 ${p.highlight ? 'text-green-100' : 'text-gray-400'}`}>
                    /mois · Afrique
                  </span>
                </div>

                {/* Prix global si différent */}
                {p.priceGlobal !== p.priceAfrica && (
                  <p className={`text-xs ${p.highlight ? 'text-green-200' : 'text-gray-400'}`}>
                    {p.priceGlobal}$/mois ailleurs dans le monde
                  </p>
                )}
              </div>

              <ul className="flex-1 space-y-2.5 mb-8">
                {p.features.map(f => (
                  <li key={f.label} className="flex items-start gap-2 text-sm">
                    {f.ok
                      ? <Check size={15} className={`shrink-0 mt-0.5 ${p.highlight ? 'text-green-100' : 'text-green-500'}`} />
                      : <X    size={15} className={`shrink-0 mt-0.5 ${p.highlight ? 'text-green-300' : 'text-gray-300'}`} />
                    }
                    <span className={f.ok
                      ? (p.highlight ? 'text-green-50' : 'text-gray-700')
                      : (p.highlight ? 'text-green-200 line-through' : 'text-gray-300 line-through')
                    }>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/auth/register')}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer active:scale-95 ${
                  p.highlight
                    ? 'bg-white text-green-600 hover:bg-green-50'
                    : 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-100'
                }`}
              >
                {p.cta}
              </button>
            </motion.div>
          ))}
        </motion.div>

        <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center text-xs text-gray-400 mt-8">
          Sans engagement · Annulation à tout moment · Paiement sécurisé (Mobile Money, Stripe)
        </motion.p>
      </div>
    </section>
  )
}
