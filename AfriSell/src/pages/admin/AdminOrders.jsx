import { useState, useEffect } from 'react'
import { ShoppingCart, Search, Loader2 } from 'lucide-react'
import { api } from '../../services/api'

const STATUS_STYLE = {
  pending:    'bg-amber-100 text-amber-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  delivering: 'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}
const STATUS_LABEL = {
  pending: 'En attente', confirmed: 'Confirmé', processing: 'En cours',
  delivering: 'En livraison', delivered: 'Livré', cancelled: 'Annulé',
}

function fmt(n) { return Number(n ?? 0).toLocaleString('fr-FR') }

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const ctrl = new AbortController()
    api.get('/api/orders/admin/', ctrl.signal)
      .then(data => setOrders(Array.isArray(data) ? data : (data?.results ?? [])))
      .catch(err => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [])

  const filtered = orders.filter(o =>
    (o.reference || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.client_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={22} className="text-indigo-600" /> Commandes (Admin)
          </h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} commande{orders.length !== 1 ? 's' : ''} sur la plateforme</p>
        </div>
        <div className="relative w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Référence, client…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition" />
        </div>
      </div>

      {error && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="text-indigo-500 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ShoppingCart size={40} className="mb-3 text-gray-200" />
            <p className="text-sm">Aucune commande trouvée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-semibold">Référence</th>
                  <th className="text-left px-5 py-3 font-semibold">Client</th>
                  <th className="text-left px-5 py-3 font-semibold">Vendeur</th>
                  <th className="text-left px-5 py-3 font-semibold">Montant</th>
                  <th className="text-left px-5 py-3 font-semibold">Date</th>
                  <th className="text-left px-5 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">{o.reference}</td>
                    <td className="px-5 py-4 font-medium text-gray-800">{o.client_name || '—'}</td>
                    <td className="px-5 py-4 text-gray-500">{o.vendor_name || o.shop_name || '—'}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{fmt(o.total_amount)} {o.currency ?? 'XOF'}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
