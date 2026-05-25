import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Loader2, CheckCircle, KeyRound } from 'lucide-react'
import Button from '../../components/ui/Button'
import heroImg from '../../assets/images/girl.png'

export default function PasswordChange() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const { authService } = await import('../../services/auth')
      await authService.requestPasswordReset(email)
      setSuccess(true)
    } catch {
      setSuccess(true) // réponse identique même si l'email n'existe pas (sécurité)
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
              Pas de panique.<br/>
              <span className="text-green-400">Votre compte est en securite.</span>
            </h1>
            <p className="text-base text-gray-300 max-w-lg leading-relaxed">
              Entrez votre adresse email et nous vous enverrons un lien pour reinitialiser votre mot de passe.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 w-fit">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <KeyRound size={16} className="text-green-400" />
            </div>
            <p className="text-xs font-medium text-white">Reinitialisation securisee en 2 minutes</p>
          </div>
        </div>
      </section>

      {/* Cote droit — formulaire */}
      <section className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] px-4 relative">

        {/* Bouton retour */}
        <button
          onClick={() => navigate('/auth/login')}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Connexion
        </button>

        <div className="w-full max-w-100">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
              <KeyRound size={28} className="text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Mot de passe oublie</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Entrez votre email et recevez un lien de reinitialisation.
            </p>
          </div>

          {!success ? (
            <form className="space-y-4" onSubmit={handleSubmit}>

              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-semibold text-gray-700 ml-1">
                  Adresse Email
                </label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  <input
                    id="email"
                    type="email"
                    placeholder="jean@exemple.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 text-sm placeholder:text-gray-400 outline-none shadow-sm"
                  />
                </div>
              </div>

              <Button size="md" onClick={handleSubmit} className="w-full justify-center">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>

            </form>
          ) : (
            /* Etat succes */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Email envoye !</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Verifiez votre boite mail. Le lien expirera dans 15 minutes.
              </p>
              <Button size="md" onClick={() => navigate('/auth/login')} className="w-full justify-center">
                Retour a la connexion
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Vous vous souvenez ?{' '}
              <Link to="/auth/login" className="text-green-600 font-bold hover:underline ml-1">
                Se connecter
              </Link>
            </p>
          </div>

          <div className="mt-4 flex justify-center gap-5 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-700 transition-colors">Support</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Francais</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Securite</a>
          </div>

        </div>
      </section>
    </main>
  )
}
