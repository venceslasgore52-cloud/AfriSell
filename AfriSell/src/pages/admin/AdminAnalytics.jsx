import { useState, useEffect } from 'react'
import { BarChart2, Users, CreditCard, TrendingUp, ShoppingCart, Package, Loader2, Store } from 'lucide-react'
import { adminService } from '../../services/adminService'

function fmt(n) { return Number(n ?? 0).toLocaleString('fr-FR') }

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon size={17} className={color} />
        </div>
      </div>
      <div className="text-2xl font-black text-gray-900">{value ?? '—'}</div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [users, setUsers]   = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.allSettled([
      adminService.listUsers(),
      adminService.listOrders(),
    ]).then(([usersRes, ordersRes]) => {
      if (!active) return
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value)
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const totalUsers    = users.length
  const totalVendors  = users.filter(u => u.role === 'tenant').length
  const activeSubs    = users.filter(u => u.has_active_subscription).length
  const totalOrders   = orders.length
  const totalRevenue  = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)

  const CARDS = [
    { icon: Users,        label: 'Utilisateurs',       value: fmt(totalUsers),   color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { icon: Store,        label: 'Vendeurs',            value: fmt(totalVendors), color: 'text-green-600',  bg: 'bg-green-50'  },
    { icon: CreditCard,   label: 'Abonnements actifs',  value: fmt(activeSubs),   color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: ShoppingCart, label: 'Commandes totales',   value: fmt(totalOrders),  color: 'text-amber-600',  bg: 'bg-amber-50'  },
    { icon: TrendingUp,   label: 'Revenus livrés (XOF)',value: fmt(totalRevenue), color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { icon: Package,      label: "Taux d'abonnement",   value: totalVendors > 0 ? `${Math.round((activeSubs / totalVendors) * 100)}%` : '—', color: 'text-pink-600', bg: 'bg-pink-50' },
  ]

  // Top vendors by order count
  const vendorOrderCount = orders.reduce((acc, o) => {
    const key = o.vendor_name || o.shop_name || 'Inconnu'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const topVendors = Object.entries(vendorOrderCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Orders by status
  const byStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})
  const STATUS_LABEL = {
    pending: 'En attente', confirmed: 'Confirmé', processing: 'En cours',
    delivered: 'Livré', cancelled: 'Annulé',
  }
  const STATUS_COLOR = {
    pending: 'bg-amber-500', confirmed: 'bg-blue-500', processing: 'bg-purple-500',
    delivered: 'bg-green-500', cancelled: 'bg-red-500',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 size={22} className="text-purple-600" /> Analytiques
        </h1>
        <p className="text-gray-500 text-sm mt-1">Vue globale des performances de la plateforme.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-purple-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {CARDS.map(c => <StatCard key={c.label} {...c} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commandes par statut */}
            {Object.keys(byStatus).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-5">Commandes par statut</h2>
                <div className="space-y-3">
                  {Object.entries(byStatus).map(([s, count]) => {
                    const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0
                    return (
                      <div key={s} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-gray-700 shrink-0">
                          {STATUS_LABEL[s] ?? s}
                        </div>
                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${STATUS_COLOR[s] ?? 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-8 text-sm font-semibold text-gray-900 text-right">{count}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Top vendeurs */}
            {topVendors.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Top vendeurs (par commandes)</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {topVendors.map(([name, count], i) => (
                    <div key={name} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 font-semibold text-gray-900 truncate">{name}</div>
                      <div className="font-bold text-gray-900">{count} cmd</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {orders.length === 0 && users.length === 0 && (
            <div className="text-center py-20 text-gray-400 text-sm">
              Aucune donnée disponible.
            </div>
          )}
        </>
      )}
    </div>
  )
}
