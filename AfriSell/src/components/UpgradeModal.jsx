import { X, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const REASONS = {
  products: 'Vous avez atteint la limite de 3 produits sur le plan gratuit.',
  orders:   'Les commandes sont réservées aux abonnés.',
  default:  'Cette fonctionnalité est réservée aux abonnés.',
}

export default function UpgradeModal({ reason = 'default', onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-amber-600" />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>

        <h3 className="font-black text-gray-900 text-lg mb-2">Passez à Pro</h3>
        <p className="text-sm text-gray-500 mb-6">{REASONS[reason] ?? REASONS.default}</p>

        <div className="flex flex-col gap-2">
          <Link
            to="/billing"
            onClick={onClose}
            className="flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition"
          >
            <Zap size={14} /> Voir les plans
          </Link>
          <button
            onClick={onClose}
            className="py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}
