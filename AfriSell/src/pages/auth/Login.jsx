import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft, Phone, ChevronDown, Search } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import Button from '../../components/ui/Button'
import heroImg from '../../assets/images/girl.png'
import { COUNTRIES, DEFAULT_COUNTRY } from '../../data/countries'
import { useAuth } from '../../context/useAuth'

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M12 5.04c1.94 0 3.51.68 4.79 1.97l3.58-3.58C18.16 1.28 15.3 0 12 0 7.31 0 3.25 2.69 1.24 6.63l4.13 3.2C6.34 7.24 8.97 5.04 12 5.04z" fill="#EA4335"/>
      <path d="M23.49 12.27c0-.85-.07-1.67-.21-2.45H12v4.65h6.48c-.28 1.48-1.11 2.73-2.35 3.56l3.64 2.82c2.13-1.97 3.72-4.88 3.72-8.58z" fill="#4285F4"/>
      <path d="M5.37 14.17c-.24-.72-.37-1.5-.37-2.31s.13-1.59.37-2.31L1.24 6.35C.45 7.99 0 9.88 0 11.86c0 1.98.45 3.87 1.24 5.51l4.13-3.2z" fill="#34A853"/>
      <path d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.64-2.82c-1.1.74-2.51 1.18-4.31 1.18-3.03 0-5.66-2.2-6.63-5.13l-4.13 3.2C3.25 21.31 7.31 24 12 24z" fill="#FBBC05"/>
    </svg>
  )
}
function FacebookIcon() {
  return (
    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}
function AppleIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.05 20.28c-.96.95-2.21 1.72-3.72 1.72-1.47 0-2.11-.84-3.61-.84s-2.18.82-3.56.82c-1.47 0-2.77-.85-3.8-1.91C.31 18.04-1.25 13.91-1.25 10.97c0-2.82 1.25-4.32 2.62-5.18 1.43-.88 2.87-.88 4.02-.88.67 0 1.54.12 2.22.38.71.27 1.25.64 1.71.64.44 0 .84-.27 1.63-.58.91-.35 1.94-.44 2.85-.44 1.35 0 2.89.37 3.86 1.38-.2.15-2.09 1.4-2.09 3.86 0 2.92 2.51 4.14 2.67 4.22-.05.15-.38 1.32-1.2 2.11M12.03 4.24c-.09-1.89 1.52-3.48 3.12-3.48.16 2-1.7 3.65-3.12 3.48z" transform="translate(4)"/>
    </svg>
  )
}

/* ── Sélecteur indicatif pays ──────────────────────────────────────────────── */
function PhoneInput({ value, onChange, country, onCountryChange }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const dropRef             = useRef(null)

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  )

  useEffect(() => {
    const close = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all" ref={dropRef}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        className="flex items-center gap-1 pl-3 pr-2 py-2.5 cursor-pointer shrink-0 border-r border-gray-200 hover:bg-gray-50 rounded-l-xl transition-colors"
      >
        <span className="text-base leading-none">{country.flag}</span>
        <span className="text-gray-600 text-xs font-medium">{country.dial}</span>
        <ChevronDown size={11} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <input
        type="tel"
        placeholder="07 00 00 00 00"
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className="flex-1 px-3 py-2.5 bg-transparent text-gray-900 text-sm placeholder:text-gray-400 outline-none"
      />
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={search}
                onChange={e => setSearch(e.target.value)} autoFocus
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-400" />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && <li className="text-xs text-gray-400 text-center py-4">Aucun résultat</li>}
            {filtered.map(c => (
              <li key={c.code}>
                <button type="button" onClick={() => { onCountryChange(c); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-green-50 transition-colors cursor-pointer text-left ${c.code === country.code ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700'}`}>
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-gray-400">{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 text-sm placeholder:text-gray-400 outline-none shadow-sm'

export default function Login() {
  const { login, socialLogin, phoneSendOTP } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]                   = useState('email') // 'email' | 'phone'
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [showPassword, setShowPassword]   = useState(false)
  const [phoneCountry, setPhoneCountry]   = useState(DEFAULT_COUNTRY)
  const [phone, setPhone]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const [socialLoading, setSocialLoading] = useState('')
  const [success, setSuccess]             = useState(false)
  const [error, setError]                 = useState('')

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSocialLoading('google')
      setError('')
      try {
        const user = await socialLogin('google', tokenResponse.access_token)
        setSuccess(true)
        setTimeout(() => navigate(user.role === 'admin' ? '/admin' : '/dashboard'), 700)
      } catch (err) {
        setError(err.message || 'Connexion Google échouée.')
      } finally {
        setSocialLoading('')
      }
    },
    onError: () => setError('Connexion Google refusée.'),
    scope: 'openid email profile',
    flow: 'implicit',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      if (mode === 'phone') {
        const fullPhone = `${phoneCountry.dial}${phone.replace(/\s/g, '')}`
        await phoneSendOTP(fullPhone)
        setSuccess(true)
        setTimeout(() => navigate('/auth/verify-otp', { state: { phone: fullPhone } }), 600)
      } else {
        const user = await login(email, password)
        setSuccess(true)
        setTimeout(() => navigate(user.role === 'admin' ? '/admin' : '/dashboard'), 700)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="h-screen flex flex-col lg:flex-row overflow-hidden bg-white">

      {/* Côté gauche — image */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={heroImg} alt="AfriSell hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 via-gray-900/30 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-10 w-full">
          <div className="space-y-3 mb-6">
            <h1 className="text-3xl font-extrabold text-white leading-tight">
              Bon retour parmi nous.<br/>
              <span className="text-green-400">Vos clients vous attendent.</span>
            </h1>
            <p className="text-base text-gray-300 max-w-lg leading-relaxed">
              Connectez-vous pour accéder à votre tableau de bord et votre bot IA AfriSell.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '98%',  label: 'Satisfaction' },
              { value: '50k+', label: 'Vendeurs' },
              { value: '1.2M', label: 'Messages/mois' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3">
                <p className="text-xl font-extrabold text-green-400">{s.value}</p>
                <p className="text-xs text-gray-300 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Côté droit — formulaire */}
      <section className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] px-4 relative overflow-y-auto py-6">

        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Accueil
        </button>

        <div className="w-full max-w-100">

          <div className="flex flex-col items-center text-center mb-5">
            <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
            <p className="text-sm text-gray-500 mt-1">Accès à votre espace vendeur AfriSell.</p>
          </div>

          {/* Toggle Email / Téléphone */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              type="button"
              onClick={() => { setMode('email'); setError('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all
                ${mode === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Mail size={14} /> Email
            </button>
            <button
              type="button"
              onClick={() => { setMode('phone'); setError('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all
                ${mode === 'phone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Phone size={14} /> Téléphone
            </button>
          </div>

          {/* Boutons sociaux */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button type="button" title="Continuer avec Google"
              onClick={() => handleGoogleLogin()} disabled={!!socialLoading}
              className="flex items-center justify-center p-2.5 rounded-xl bg-white border border-gray-200 hover:border-green-400 hover:shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-60">
              {socialLoading === 'google'
                ? <Loader2 size={18} className="animate-spin text-gray-400" />
                : <GoogleIcon />}
            </button>
            <button type="button" disabled
              className="flex items-center justify-center p-2.5 rounded-xl bg-white border border-gray-200 opacity-50 cursor-not-allowed">
              <FacebookIcon />
            </button>
            <button type="button" disabled
              className="flex items-center justify-center p-2.5 rounded-xl bg-white border border-gray-200 opacity-50 cursor-not-allowed">
              <AppleIcon />
            </button>
          </div>

          {/* Séparateur */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[#f8fafc] text-xs text-gray-400 font-medium uppercase tracking-widest">
                {mode === 'phone' ? 'ou avec téléphone' : 'ou avec email'}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>

            {/* ── Mode TÉLÉPHONE ── */}
            {mode === 'phone' && (
              <>
                <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 flex items-center gap-2">
                  <Phone size={13} className="shrink-0" />
                  Un code de vérification sera envoyé sur <strong>WhatsApp</strong>.
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700 ml-1">Numéro WhatsApp</label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    country={phoneCountry}
                    onCountryChange={setPhoneCountry}
                  />
                  {phone && (
                    <p className="text-xs text-gray-400 ml-1">
                      Numéro complet : <span className="text-gray-600 font-medium">{phoneCountry.dial}{phone.replace(/\s/g, '')}</span>
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ── Mode EMAIL ── */}
            {mode === 'email' && (
              <>
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-700 ml-1">Adresse Email</label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    <input id="email" type="email" placeholder="jean@exemple.com" required
                      value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between ml-1 mr-1">
                    <label htmlFor="password" className="text-xs font-semibold text-gray-700">Mot de passe</label>
                    <Link to="/auth/forgot-password" className="text-xs text-green-600 hover:underline">Oublié ?</Link>
                  </div>
                  <div className="relative group">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    <input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required
                      value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <Button type="submit" size="md" className="w-full justify-center" disabled={loading || success}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {success && <CheckCircle size={16} />}
              {success
                ? (mode === 'phone' ? 'Code envoyé !' : 'Connexion réussie !')
                : loading
                  ? (mode === 'phone' ? 'Envoi du code...' : 'Connexion...')
                  : (mode === 'phone' ? 'Recevoir le code WhatsApp' : 'Se connecter')
              }
            </Button>

          </form>

          <div className="mt-5 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <Link to="/auth/register" className="text-green-600 font-bold hover:underline ml-1">
                Créer un compte
              </Link>
            </p>
          </div>

          <div className="mt-3 flex justify-center gap-5 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-700 transition-colors">Support</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Français</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Sécurité</a>
          </div>

        </div>
      </section>
    </main>
  )
}
