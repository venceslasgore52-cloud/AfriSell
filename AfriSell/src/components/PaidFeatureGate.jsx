import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

const LABELS = {
  orders:     'Les commandes',
  analytics:  'Les analytiques',
  bot:        'Le bot WhatsApp',
  studio:     'Le studio IA',
}

export default function PaidFeatureGate({ feature }) {
  const label = LABELS[feature] ?? 'Cette fonctionnalité'
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Lock size={24} className="text-amber-600" />
        </div>
        <h2 className="font-black text-gray-900 text-lg mb-2">Fonctionnalité payante</h2>
        <p className="text-sm text-gray-500 mb-6">
          {label} est réservé aux abonnés. Passez à un plan payant pour y accéder.
        </p>
        <Link
          to="/billing"
          className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition w-full"
        >
          Voir les plans
        </Link>
      </div>
    </div>
  )
}
