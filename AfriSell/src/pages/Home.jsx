import { motion } from 'framer-motion'
import {
  MessageCircle, Bot, BarChart3, ShoppingBag, Zap, Shield,
  ArrowRight, Star,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import PrimaryButton from '../components/ui/Button'
import Cadre from '../components/ui/Cadre'
import PlanCadre from '../components/shared/PlanCadre'
import Footer from '../components/layout/Footer'
/* ── Animation helpers ─────────────────────────────────────── */
const fadeUp  = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.1 } } }

/* ── Data ──────────────────────────────────────────────────── */
const features = [
  {
    icon: <Bot size={24} />,
    title: 'Bot IA 24/7',
    desc: 'Votre assistant Claude répond aux clients à toute heure — commandes, prix, disponibilités.',
  },
  {
    icon: <ShoppingBag size={24} />,
    title: 'Catalogue intégré',
    desc: 'Gérez vos produits, variantes et stocks directement depuis le dashboard.',
  },
  {
    icon: <MessageCircle size={24} />,
    title: 'Broadcasts WhatsApp',
    desc: 'Envoyez des campagnes ciblées à vos contacts en quelques clics.',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Analytics en temps réel',
    desc: 'Suivez vos ventes, messages et performances depuis un seul écran.',
  },
  {
    icon: <Shield size={24} />,
    title: 'Multi-tenant sécurisé',
    desc: 'Chaque boutique est isolée. Vos données ne se mélangent jamais.',
  },
  {
    icon: <Zap size={24} />,
    title: 'Paiements Mobile Money',
    desc: 'Orange Money, Wave, MTN MoMo et Stripe — vos clients paient comme ils veulent.',
  },
]

const steps = [
  { n: '01', title: 'Créez votre boutique', desc: 'Renseignez le nom, la catégorie et le numéro WhatsApp Business en moins de 2 minutes.' },
  { n: '02', title: 'Ajoutez vos produits', desc: 'Importez votre catalogue avec photos, prix et stocks. Le bot les connaît instantanément.' },
  { n: '03', title: 'Activez le bot IA', desc: 'Claude prend le relais : répond, conseille et guide vos clients 24h/24.' },
  { n: '04', title: 'Encaissez & analysez', desc: 'Suivez vos revenus et optimisez grâce aux insights analytics.' },
]

const testimonials = [
  {
    name: 'Aminata Diallo',
    role: 'Boutique mode, Dakar',
    avatar: 'AD',
    text: 'Depuis AfriSell, mes clientes commandent à 23h et reçoivent une réponse immédiate. Mes ventes ont augmenté de 40 % en 3 mois.',
    stars: 5,
  },
  {
    name: 'Kofi Mensah',
    role: 'Épicerie fine, Abidjan',
    avatar: 'KM',
    text: 'Le bot connaît tous mes produits par cœur. Il répond mieux que certains de mes vendeurs, honnêtement.',
    stars: 5,
  },
  {
    name: 'Fatima Zahra',
    role: 'Cosmétiques, Casablanca',
    avatar: 'FZ',
    text: "J'envoyais des messages un par un avant. Maintenant une campagne touche 800 contacts en un clic. Incroyable.",
    stars: 5,
  },
]

const stats = [
  { value: '2 400+',  label: 'Boutiques actives' },
  { value: '1.2M',    label: 'Messages traités / mois' },
  { value: '98 %',    label: 'Satisfaction client' },
  { value: '12 pays', label: 'en Afrique & MENA' },
]

/* ── Sections ──────────────────────────────────────────────── */

function Hero() {
  const navigate = useNavigate()
  return (
    <section className="relative overflow-hidden bg-white pt-10 pb-24 px-4">
      <div className="absolute -top-32 -right-32 w-125 h-125 bg-green-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-100 h-100 bg-green-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 bg-white-500 border border-green-200 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Propulsé par Claude (Anthropic) / Gemini (Google)
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6"
        >
          Votre commerce vend même quand vous{' '}
          <span className="relative text-green-500">dormez 24h/24
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
              <path d="M0 6 Q100 0 200 6" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4" />
            </svg>
          </span>
          <br />sur WhatsApp
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-500 text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          AfriSell automatise vos ventes WhatsApp, gère vos commandes et publie vos produits sur les réseaux sociaux. Tout en un, sans aucune ligne de code.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <PrimaryButton size="lg" onClick={() => navigate('/auth/register')}>
            Démarrer gratuitement <ArrowRight size={20} />
          </PrimaryButton>
          <PrimaryButton size="lg" outline onClick={() => navigate('/auth/login')}>
            Se connecter
          </PrimaryButton>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-sm text-gray-400"
        >
          ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ Gratuit 14 jours &nbsp;·&nbsp; ✓ Configuration en 5 min
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 relative max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-300" />
              <div className="w-3 h-3 rounded-full bg-yellow-300" />
              <div className="w-3 h-3 rounded-full bg-green-300" />
              <div className="flex-1 mx-4 bg-white rounded-full py-1 px-4 text-xs text-gray-400 border border-gray-200 text-left">
                app.AfriSell.io/dashboard
              </div>
            </div>
            <div className="p-6 bg-[#f8fafc]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Messages aujourd'hui", value: '248', color: 'bg-green-50 border-green-200 text-green-700' },
                  { label: 'Commandes', value: '34', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { label: 'Revenus', value: '182 000 XOF', color: 'bg-purple-50 border-purple-200 text-purple-700' },
                ].map(c => (
                  <div key={c.label} className={`rounded-2xl border p-4 text-left ${c.color}`}>
                    <p className="text-xs font-medium opacity-70 mb-1">{c.label}</p>
                    <p className="text-xl font-bold">{c.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">K</div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2 text-sm text-gray-700 max-w-[60%] text-left">
                    Bonjour, est-ce que la robe rouge est disponible en taille M ?
                  </div>
                </div>
                <div className="flex gap-3 items-start justify-end">
                  <div className="bg-green-500 text-white rounded-2xl rounded-tr-none px-4 py-2 text-sm max-w-[65%] text-left">
                    Oui ! La robe rouge est disponible en M 🎉 Prix : 12 500 XOF. Je vous envoie le lien de paiement ?
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-100 shrink-0 flex items-center justify-center">
                    <Bot size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">K</div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2 text-sm text-gray-700 text-left">
                    Oui parfait ! 👍
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 -z-10 bg-green-200 rounded-3xl blur-2xl opacity-20 scale-95" />
        </motion.div>
      </div>
    </section>
  )
}

function Stats() {
  return (
    <section className="bg-green-800 py-6 shink-0 rounded-xl mb-24">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
      >
        {stats.map(s => (
          <motion.div key={s.label} variants={fadeUp}>
            <p className="text-4xl font-extrabold text-white mb-1">{s.value}</p>
            <p className="text-green-100 text-sm">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-16">
          <Cadre
            badge="Fonctionnalités"
            title="Tout ce dont une boutique africaine a besoin"
            sub="De la gestion catalogue au bot IA, AfriSell couvre l'intégralité du parcours client WhatsApp."
          />
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map(f => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how" className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-16">
          <Cadre
            badge="Comment ça marche"
            title="Prêt en moins de 10 minutes"
            sub="Pas de code, pas d'intégration complexe. Votre bot est opérationnel le jour même."
          />
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8"
        >
          {steps.map(s => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              className="flex gap-5 items-start p-6 rounded-2xl border border-gray-100 bg-[#f8fafc] hover:border-green-200 transition-colors"
            >
              <span className="text-4xl font-extrabold text-green-300 leading-none select-none">{s.n}</span>
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-16">
          <Cadre
            badge="Témoignages"
            title="Ils ont transformé leur boutique"
            sub="Plus de 2 400 commerçants africains font confiance à AfriSell."
          />
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {testimonials.map(t => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 hover:border-green-200 transition-colors"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function CTA() {
  const navigate = useNavigate()
  return (
    <section className="py-24 px-4 bg-[#f8fafc]">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center bg-green-500 rounded-3xl p-12 shadow-2xl shadow-green-200 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-400 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle size={28} className="text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            Prêt à vendre pendant que vous dormez ?
          </h2>
          <p className="text-green-100 text-lg mb-8">
            Rejoignez les boutiques qui font confiance à AfriSell. Gratuit pour commencer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PrimaryButton size="lg" variant="white" onClick={() => navigate('/auth/register')}>
              Créer ma boutique gratuitement
            </PrimaryButton>
            <PrimaryButton size="lg" variant="ghost" onClick={() => navigate('/auth/login')}>
              Voir la démo
            </PrimaryButton>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

/* ── Page ──────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <PlanCadre />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  )
}
