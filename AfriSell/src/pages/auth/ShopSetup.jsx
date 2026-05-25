import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Store, MapPin, Tag, Package, Loader2, CheckCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
import { COUNTRIES, DEFAULT_COUNTRY } from '../../data/countries'
import { getCities } from '../../data/cities'
import { api } from '../../services/api'

const CATEGORIES = [
  'Mode & Vetements', 'Electronique', 'Alimentation', 'Beaute & Soins',
  'Maison & Deco', 'Sport & Loisirs', 'Sante', 'Autres',
]

const inputCls = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 text-sm placeholder:text-gray-400 outline-none shadow-sm'

function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i < current ? 'w-2 h-2 bg-green-500' :
            i === current ? 'w-6 h-2 bg-green-500' :
            'w-2 h-2 bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function ShopSetup() {
  const [step, setStep]           = useState(0)
  const [shopName, setShopName]   = useState('')
  const [country, setCountry]     = useState(DEFAULT_COUNTRY)
  const [city, setCity]           = useState('')
  const [category, setCategory]   = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)
  const navigate = useNavigate()

  const steps = [
    {
      icon: <Store size={28} className="text-green-600" />,
      title: 'Nom de votre boutique',
      subtitle: 'C\'est le nom que verront vos clients.',
    },
    {
      icon: <MapPin size={28} className="text-green-600" />,
      title: 'Votre localisation',
      subtitle: 'Ou se trouve votre activite ?',
    },
    {
      icon: <Tag size={28} className="text-green-600" />,
      title: 'Categorie',
      subtitle: 'Quel type de produits vendez-vous ?',
    },
    {
      icon: <Package size={28} className="text-green-600" />,
      title: 'Description',
      subtitle: 'Decrivez votre boutique en quelques mots.',
    },
  ]

  const canNext = () => {
    if (step === 0) return shopName.trim().length >= 2
    if (step === 1) return !!country?.code && city.trim().length >= 2
    if (step === 2) return !!category
    if (step === 3) return description.trim().length >= 10
    return false
  }

  const [error, setError] = useState('')

  const handleNext = async () => {
    if (step < steps.length - 1) { setStep(s => s + 1); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/api/accounts/me/shop/', {
        name: shopName,
        country: country.code,
        city,
        category,
        description,
      })
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 1800)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden">

      {/* Decor */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-green-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      {/* Bouton retour */}
      {step > 0 && !done && (
        <button
          onClick={() => setStep(s => s - 1)}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors cursor-pointer z-10"
        >
          <ArrowLeft size={16} />
          Retour
        </button>
      )}

      <div className="w-full max-w-110 px-4 z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-2">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-1">Configuration de la boutique</p>
          </div>

          {!done ? (
            <>
              <StepDots current={step} total={steps.length} />

              {/* Icone + titre */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-3">
                  {steps[step].icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{steps[step].title}</h2>
                <p className="text-sm text-gray-500 mt-1">{steps[step].subtitle}</p>
              </div>

              {/* Contenu de l'etape */}
              <div className="space-y-3 mb-6">
                {step === 0 && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700 ml-1">Nom de la boutique</label>
                    <div className="relative group">
                      <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="Ex: Jean Mode Dakar"
                        value={shopName}
                        onChange={e => setShopName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 text-sm placeholder:text-gray-400 outline-none shadow-sm"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-400 ml-1">Minimum 2 caracteres.</p>
                  </div>
                )}

                {step === 1 && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700 ml-1">Pays</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base leading-none pointer-events-none select-none">{country.flag}</span>
                        <select
                          value={country.code}
                          onChange={e => { setCountry(COUNTRIES.find(c => c.code === e.target.value)); setCity('') }}
                          className={`${inputCls} pl-9 appearance-none cursor-pointer`}
                        >
                          {COUNTRIES.map(c => (
                            <option key={c.code} value={c.code}>{c.name} ({c.dial})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700 ml-1">Ville</label>
                      <div className="relative group">
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors pointer-events-none" />
                        {getCities(country.code).length > 0 ? (
                          <select
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 text-sm outline-none shadow-sm appearance-none cursor-pointer"
                          >
                            <option value="">-- Choisir une ville --</option>
                            {getCities(country.code).map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Ex: Dakar, Abidjan..."
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 text-sm placeholder:text-gray-400 outline-none shadow-sm"
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                          category === cat
                            ? 'bg-green-500 border-green-500 text-white shadow-sm shadow-green-200'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-green-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700 ml-1">Description</label>
                    <textarea
                      placeholder="Decrivez votre boutique, ce que vous vendez, votre zone de livraison..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={4}
                      className={`${inputCls} resize-none`}
                    />
                    <p className="text-xs text-gray-400 ml-1">{description.length}/200 — minimum 10 caracteres.</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                size="md"
                onClick={handleNext}
                disabled={!canNext() || loading}
                className="w-full justify-center"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Creation en cours...' : step < steps.length - 1 ? (
                  <><span>Continuer</span><ArrowRight size={16} /></>
                ) : 'Creer ma boutique'}
              </Button>

              <p className="text-center text-xs text-gray-400 mt-4">
                Etape {step + 1} sur {steps.length}
              </p>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Boutique creee !</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                <span className="font-semibold text-gray-700">{shopName}</span> est prete.
                Vous allez etre redirige vers votre tableau de bord.
              </p>
              <div className="flex justify-center">
                <Loader2 size={22} className="animate-spin text-green-500" />
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
