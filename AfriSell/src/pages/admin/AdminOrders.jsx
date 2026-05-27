import { useState, useEffect } from 'react'
import { ShoppingCart, Search, Loader2, MapPin, Phone, User, Package } from 'lucide-react'
import { api } from '../../services/api'
import DetailDrawer, { Field, Section, Divider } from '../../components/admin/DetailDrawer'

const STATUS_STYLE = {
  pending:    'bg-amber-100 text-amber-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  delivering: 'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}
const STATUS_LABEL = {
  pending:    'En attente',
  confirmed:  'Confirmé',
  processing: 'En cours',
  delivering: 'En livraison',
  delivered:  'Livré',
  cancelled:  'Annulé',
}
const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'delivering', 'delivered']

function fmt(n) { return Number(n ?? 0).toLocaleString('fr-FR') }

function fmtDate(iso, time = false) {
  if (!iso) return '—'
  const opts = { day: 'numeric', month: 'long', year: 'numeric' }
  if (time) Object.assign(opts, { hour: '2-digit', minute: '2-digit' })
  return new Date(iso).toLocaleDateString('fr-FR', opts)
}

/* ── Timeline de statut ──────────────────────────────────────────────────────── */
function StatusTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-red-50 border border-red-200 rounded-xl">
        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        <span className="text-xs font-semibold text-red-700">Commande annulée</span>
      </div>
    )
  }
  const current = STATUS_STEPS.indexOf(status)
  return (
    <div className="relative">
      {STATUS_STEPS.map((step, i) => {
        const done    = i <= current
        const active  = i === current
        return (
          <div key={step} className="flex items-start gap-3 mb-3 last:mb-0">
            <div className="flex flex-col items-center shrink-0 mt-0.5">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                done ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
              }`}>
                {done && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`w-px h-5 mt-1 ${done && i < current ? 'bg-gray-900' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className="pb-1">
              <p className={`text-xs font-semibold ${done ? 'text-gray-900' : 'text-gray-300'}`}>
                {STATUS_LABEL[step]}
              </p>
              {active && <p className="text-[10px] text-gray-400 mt-0.5">Statut actuel</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Drawer contenu commande ─────────────────────────────────────────────────── */
function OrderDrawer({ order: o }) {
  if (!o) return null

  const items = o.items || o.order_items || []

  return (
    <>
      {/* Entête commande */}
      <div className="flex items-start justify-between gap-3 mb-5 p-4 bg-gray-50 rounded-2xl">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Référence</p>
          <p className="font-mono font-bold text-gray-900 text-sm">{o.reference || o.id}</p>
          <p className="text-xs text-gray-400 mt-1">{fmtDate(o.created_at, true)}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${
          STATUS_STYLE[o.status] ?? 'bg-gray-100 text-gray-600'
        }`}>
          {STATUS_LABEL[o.status] ?? o.status}
        </span>
      </div>

      {/* Montant */}
      <div className="text-center py-4 mb-5 border border-gray-100 rounded-2xl">
        <p className="text-3xl font-black text-gray-900">
          {fmt(o.total_amount)} <span className="text-base font-semibold text-gray-400">{o.currency ?? 'XOF'}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">{items.length} article{items.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Timeline */}
      <Section title="Progression">
        <StatusTimeline status={o.status} />
      </Section>

      <Divider />

      {/* Client */}
      <Section title="Client">
        <Field label="Nom"       value={o.client_name} />
        <Field label="Téléphone" value={o.client_phone} />
        <Field label="Email"     value={o.client_email} />
        <Field label="Adresse"   value={o.delivery_address || o.address} />
        <Field label="Ville"     value={o.city} />
        <Field label="Pays"      value={o.country} />
      </Section>

      <Divider />

      {/* Vendeur */}
      <Section title="Vendeur">
        <Field label="Boutique"  value={o.vendor_name || o.shop_name} />
        <Field label="Vendeur"   value={o.vendor_username} />
      </Section>

      {/* Articles */}
      {items.length > 0 && (
        <>
          <Divider />
          <Section title={`Articles (${items.length})`}>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.product_name || item.name || '—'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.quantity} × {fmt(item.unit_price ?? item.price)} XOF
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">
                    {fmt((item.quantity ?? 1) * (item.unit_price ?? item.price ?? 0))} XOF
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Récap total */}
          <div className="mt-3 p-3 bg-gray-900 rounded-xl flex justify-between items-center">
            <p className="text-sm font-semibold text-gray-400">Total</p>
            <p className="text-base font-black text-white">{fmt(o.total_amount)} {o.currency ?? 'XOF'}</p>
          </div>
        </>
      )}

      {o.notes && (
        <>
          <Divider />
          <Section title="Notes">
            <p className="text-sm text-gray-600 leading-relaxed">{o.notes}</p>
          </Section>
        </>
      )}
    </>
  )
}

/* ── Page principale ─────────────────────────────────────────────────────────── */
export default function AdminOrders() {
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [error, setError]       = useState('')
  const [selected, setSelected] = useState(null)

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
    (o.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.vendor_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart size={22} className="text-indigo-600" /> Commandes
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {orders.length} commande{orders.length !== 1 ? 's' : ''} sur la plateforme
            </p>
          </div>
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Référence, client, vendeur…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition" />
          </div>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="text-indigo-500 animate-spin" />
            </div>
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
                    <tr
                      key={o.id}
                      onClick={() => setSelected(o)}
                      className="hover:bg-gray-50/70 transition cursor-pointer group"
                    >
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-gray-700 group-hover:text-indigo-700 transition">
                        {o.reference}
                      </td>
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

      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Commande ${selected?.reference || ''}`}
        subtitle={selected?.client_name ? `Client : ${selected.client_name}` : ''}
      >
        <OrderDrawer order={selected} />
      </DetailDrawer>
    </>
  )
}
