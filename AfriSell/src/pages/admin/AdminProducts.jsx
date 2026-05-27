import { useState, useEffect } from 'react'
import { Package, Search, Loader2, Tag, Store, Hash, BarChart2, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '../../services/api'
import DetailDrawer, { Field, Section, Divider } from '../../components/admin/DetailDrawer'

function fmt(n) { return Number(n ?? 0).toLocaleString('fr-FR') }

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/* ── Drawer contenu produit ─────────────────────────────────────────────────── */
function ProductDrawer({ product: p }) {
  if (!p) return null
  const isActive = p.statut === 'active'

  return (
    <>
      {/* Image + titre */}
      <div className="mb-6">
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            className="w-full h-52 object-cover rounded-2xl border border-gray-100 mb-4"
          />
        ) : (
          <div className="w-full h-36 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Package size={40} className="text-gray-300" />
          </div>
        )}
        <h3 className="font-bold text-gray-900 text-lg leading-tight">{p.name}</h3>
        <p className="text-2xl font-black text-gray-900 mt-1">{fmt(p.price)} <span className="text-sm font-semibold text-gray-400">XOF</span></p>
      </div>

      {/* Statut */}
      <div className="mb-5">
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
            <CheckCircle2 size={12} /> Produit actif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full">
            <XCircle size={12} /> {p.statut || 'Inactif'}
          </span>
        )}
      </div>

      <Section title="Informations produit">
        <Field label="Catégorie"   value={p.display_category || p.category} />
        <Field label="Vendeur"     value={p.vendor_name} />
        <Field label="Stock"       value={p.quantity !== undefined ? `${p.quantity} unités` : '—'} />
        <Field label="Référence"   value={p.sku || p.reference} mono />
        <Field label="Ajouté le"   value={fmtDate(p.created_at)} />
      </Section>

      {p.description && (
        <>
          <Divider />
          <Section title="Description">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.description}</p>
          </Section>
        </>
      )}

      {(p.weight || p.dimensions) && (
        <>
          <Divider />
          <Section title="Caractéristiques">
            {p.weight     && <Field label="Poids"      value={`${p.weight} kg`} />}
            {p.dimensions && <Field label="Dimensions" value={p.dimensions} />}
          </Section>
        </>
      )}

      {/* Stats rapides */}
      <Divider />
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Ventes',   value: p.sales_count ?? '—' },
          { label: 'Vues',     value: p.views_count ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
            <p className="text-xl font-black text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </>
  )
}

/* ── Page principale ─────────────────────────────────────────────────────────── */
export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [error, setError]       = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const ctrl = new AbortController()
    api.get('/api/catalogue/admin/', ctrl.signal)
      .then(data => setProducts(Array.isArray(data) ? data : (data?.results ?? [])))
      .catch(err => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [])

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.vendor_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package size={22} className="text-blue-600" /> Produits
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {products.length} produit{products.length !== 1 ? 's' : ''} sur la plateforme
            </p>
          </div>
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, vendeur…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="text-blue-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Package size={40} className="mb-3 text-gray-200" />
              <p className="text-sm">Aucun produit trouvé.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-semibold">Produit</th>
                    <th className="text-left px-5 py-3 font-semibold">Vendeur</th>
                    <th className="text-left px-5 py-3 font-semibold">Catégorie</th>
                    <th className="text-left px-5 py-3 font-semibold">Prix</th>
                    <th className="text-left px-5 py-3 font-semibold">Stock</th>
                    <th className="text-left px-5 py-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="hover:bg-gray-50/70 transition cursor-pointer group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <Package size={14} className="text-gray-300" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900 group-hover:text-blue-700 transition">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{p.vendor_name || '—'}</td>
                      <td className="px-5 py-4 text-gray-500">{p.display_category || p.category || '—'}</td>
                      <td className="px-5 py-4 font-semibold text-gray-800">{fmt(p.price)} XOF</td>
                      <td className="px-5 py-4 text-gray-600">{p.quantity ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          p.statut === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.statut === 'active' ? 'Actif' : (p.statut ?? 'Inactif')}
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
        title={selected?.name || 'Produit'}
        subtitle={selected?.vendor_name ? `par ${selected.vendor_name}` : ''}
      >
        <ProductDrawer product={selected} />
      </DetailDrawer>
    </>
  )
}
