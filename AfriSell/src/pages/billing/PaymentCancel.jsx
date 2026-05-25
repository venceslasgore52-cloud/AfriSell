import { useNavigate } from 'react-router-dom'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function PaymentCancel() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">

        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} className="text-red-400" />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2">Paiement annulé</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Votre paiement a été annulé. Aucun montant n'a été débité.
          Vous pouvez réessayer à tout moment.
        </p>

        <button
          onClick={() => navigate('/billing')}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition active:scale-[0.98] mb-3"
        >
          <RefreshCw size={16} /> Réessayer le paiement
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={14} /> Retour au tableau de bord
        </button>
      </div>
    </main>
  )
}
