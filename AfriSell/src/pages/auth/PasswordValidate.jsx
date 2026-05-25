import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, CheckCircle, ShieldCheck } from 'lucide-react'
import Button from '../../components/ui/Button'
import heroImg from '../../assets/images/girl.png'

function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const labels = ['Tres faible', 'Faible', 'Moyen', 'Fort', 'Tres fort']
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-600']

  if (!password) return null
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score <= 1 ? 'text-red-500' : score <= 2 ? 'text-yellow-600' : 'text-green-600'}`}>
        {labels[score]}
      </p>
    </div>
  )
}

export default function PasswordValidate() {
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [showConf, setShowConf]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState('')
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const token          = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      navigate('/auth/forgot-password', { replace: true })
    }
  }, [token, navigate])

  const inputCls = 'w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 text-sm placeholder:text-gray-400 outline-none shadow-sm'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      const { authService } = await import('../../services/auth')
      await authService.confirmPasswordReset(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/auth/login'), 2000)
    } catch (err) {
      setError(err.message || 'Lien invalide ou expiré. Demandez un nouveau lien.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="h-screen flex flex-col lg:flex-row overflow-hidden bg-white">

      {/* Cote gauche — image */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={heroImg} alt="AfriSell hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 via-gray-900/30 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-10 w-full">
          <div className="space-y-3 mb-6">
            <h1 className="text-3xl font-extrabold text-white leading-tight">
              Presque termine.<br/>
              <span className="text-green-400">Choisissez un mot de passe fort.</span>
            </h1>
            <p className="text-base text-gray-300 max-w-lg leading-relaxed">
              Un bon mot de passe contient majuscules, chiffres et caracteres speciaux.
            </p>
          </div>
          <div className="space-y-2">
            {[
              { ok: password.length >= 8,         label: '8 caracteres minimum' },
              { ok: /[A-Z]/.test(password),       label: 'Une majuscule' },
              { ok: /[0-9]/.test(password),       label: 'Un chiffre' },
              { ok: /[^A-Za-z0-9]/.test(password),label: 'Un caractere special' },
            ].map(({ ok, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${ok ? 'bg-green-500 border-green-500' : 'border-white/40'}`}>
                  {ok && <CheckCircle size={10} className="text-white" />}
                </div>
                <span className={`text-xs transition-colors ${ok ? 'text-green-300' : 'text-gray-400'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cote droit — formulaire */}
      <section className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] px-4 relative">

        {/* Bouton retour */}
        <button
          onClick={() => navigate('/auth/forgot-password')}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Retour
        </button>

        <div className="w-full max-w-100">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck size={28} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h2>
            <p className="text-sm text-gray-500 mt-2">
              Choisissez un mot de passe securise pour votre compte.
            </p>
          </div>

          {!success ? (
            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* Nouveau mot de passe */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700 ml-1">
                  Nouveau mot de passe
                </label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  <input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    required
                    className={inputCls}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirmer */}
              <div className="space-y-1">
                <label htmlFor="confirm" className="block text-xs font-semibold text-gray-700 ml-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  <input
                    id="confirm"
                    type={showConf ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError('') }}
                    required
                    className={`${inputCls} ${confirm && confirm !== password ? 'border-red-400 focus:border-red-400' : ''}`}
                  />
                  <button type="button" onClick={() => setShowConf(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                    {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p className="text-xs text-red-500 ml-1">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              {error && (
                <p className="text-xs text-red-500 text-center">{error}</p>
              )}

              <Button size="md" onClick={handleSubmit} className="w-full justify-center">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Reinitialisation...' : 'Definir le mot de passe'}
              </Button>

            </form>
          ) : (
            /* Etat succes */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Mot de passe modifie !</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                Vous allez etre redirige vers la connexion...
              </p>
              <div className="flex justify-center">
                <Loader2 size={20} className="animate-spin text-green-500" />
              </div>
            </div>
          )}

        </div>
      </section>
    </main>
  )
}
