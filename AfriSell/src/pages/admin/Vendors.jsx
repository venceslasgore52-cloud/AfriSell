import { useState, useEffect } from 'react'
import { Store, Search, Loader2, CheckCircle, XCircle, MoreVertical } from 'lucide-react'
import { api } from '../../services/api'

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const ctrl = new AbortController()
    api.get('/api/accounts/admin/vendors/', ctrl.signal)
      .then(data => setVendors(Array.isArray(data) ? data : (data?.results ?? [])))
      .catch(err => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [])

  const filtered = vendors.filter(v =>
    (v.username || v.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store size={22} className="text-green-600" /> Vendeurs
          </h1>
          <p className="text-gray-500 text-sm mt-1">{vendors.length} vendeur{vendors.length !== 1 ? 's' : ''} inscrits</p>
        </div>
        <div className="relative w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>
      </div>

      {error && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-green-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Store size={40} className="mb-3 text-gray-200" />
            <p className="text-sm">Aucun vendeur trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-semibold">Vendeur</th>
                  <th className="text-left px-5 py-3 font-semibold">Boutique</th>
                  <th className="text-left px-5 py-3 font-semibold">Plan</th>
                  <th className="text-left px-5 py-3 font-semibold">Inscription</th>
                  <th className="text-left px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {(v.username || v.email)?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{v.username || '—'}</div>
                          <div className="text-xs text-gray-400">{v.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{v.shop_name || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${v.has_active_subscription ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {v.plan || (v.has_active_subscription ? 'Payant' : 'Gratuit')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {v.is_active !== false ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                          <CheckCircle size={13} /> Actif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                          <XCircle size={13} /> Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400">
                        <MoreVertical size={15} />
                      </button>
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
