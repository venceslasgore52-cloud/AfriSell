import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { authService } from '../../services/auth'

export default function VerifyEmail() {
  const [searchParams]            = useSearchParams()
  const [status, setStatus]       = useState('loading') // loading | success | error
  const [message, setMessage]     = useState('')
  const navigate                  = useNavigate()
  const token                     = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Lien de vérification invalide.')
      return
    }
    authService.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error')
        setMessage(err.message || 'Lien invalide ou expiré.')
      })
  }, [token])

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">

        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Loader2 size={30} className="text-green-500 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Vérification en cours…</h2>
            <p className="text-sm text-gray-500">Veuillez patienter quelques secondes.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={30} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email vérifié !</h2>
            <p className="text-sm text-gray-500 mb-6">
              Votre adresse email a été confirmée avec succès. Vous pouvez maintenant vous connecter.
            </p>
            <button
              onClick={() => navigate('/auth/login')}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition text-sm"
            >
              Se connecter
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle size={30} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h2>
            <p className="text-sm text-gray-500 mb-6">
              {message || 'Ce lien de vérification est invalide ou a expiré (24h).'}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/auth/login')}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition text-sm"
              >
                Retour à la connexion
              </button>
              <button
                onClick={() => navigate('/auth/register')}
                className="w-full py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition text-sm"
              >
                Créer un compte
              </button>
            </div>
          </>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Mail size={12} />
          <span>AfriSell — Vérification d'email</span>
        </div>
      </div>
    </main>
  )
}
