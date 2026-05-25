import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Zap } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { authService } from '../../services/auth'

export default function PaymentSuccess() {
  const navigate     = useNavigate()
  const { updateUser } = useAuth()

  useEffect(() => {
    // Rafraîchit le profil pour que has_active_subscription soit à jour
    authService.getMe()
      .then(data => updateUser(data))
      .catch(() => {})
  }, [updateUser])

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">

        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2">Paiement réussi !</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Votre abonnement est maintenant actif. Toutes les fonctionnalités sont débloquées.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-8 flex items-center gap-3">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <Zap size={18} className="text-green-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-green-800">Abonnement activé</p>
            <p className="text-xs text-green-600">Accès complet à toutes les fonctionnalités AfriSell</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition active:scale-[0.98]"
        >
          Accéder au tableau de bord <ArrowRight size={16} />
        </button>

        <button
          onClick={() => navigate('/billing')}
          className="mt-3 w-full py-3 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          Voir mon abonnement
        </button>
      </div>
    </main>
  )
}
