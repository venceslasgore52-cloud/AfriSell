import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Eye, CheckCircle, Clock, XCircle, Package, Loader2 } from 'lucide-react';
import PaidFeatureGate from '../../components/PaidFeatureGate';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/useAuth';

const STATUS = {
  pending:   { label: 'En attente',  color: 'bg-amber-100 text-amber-700',  icon: Clock        },
  confirmed: { label: 'Confirmée',   color: 'bg-blue-100 text-blue-700',    icon: CheckCircle  },
  delivered: { label: 'Livrée',      color: 'bg-green-100 text-green-700',  icon: CheckCircle  },
  cancelled: { label: 'Annulée',     color: 'bg-red-100 text-red-700',      icon: XCircle      },
};

export default function Orders() {
  const { isFree } = useAuth();
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    if (isFree) return;
    orderService.list()
      .then((data) => setAllOrders(Array.isArray(data) ? data : data.results ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isFree]);

  if (isFree) return <PaidFeatureGate feature="orders" />;

  const orders = allOrders.filter((o) => {
    const matchSearch = o.customer?.toLowerCase().includes(search.toLowerCase())
      || o.product?.toLowerCase().includes(search.toLowerCase())
      || String(o.id).toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || o.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 pt-2 md:pt-0">
        <h1 className="text-2xl font-black text-gray-900">Commandes</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gérez les commandes reçues via votre bot WhatsApp.</p>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {Object.entries(STATUS).map(([key, s]) => {
          const Icon = s.icon;
          const count = allOrders.filter((o) => o.status === key).length;
          return (
            <button key={key} onClick={() => setFilter(filter === key ? 'all' : key)}
              className={`bg-white rounded-2xl border-2 p-4 text-left transition ${filter === key ? 'border-green-400' : 'border-gray-100 hover:border-gray-200'}`}>
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold mb-2 ${s.color}`}>
                <Icon size={11} /> {s.label}
              </div>
              <p className="text-2xl font-black text-gray-900">{loading ? '…' : count}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une commande…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-green-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">ID</th>
                  <th className="text-left px-5 py-3">Client</th>
                  <th className="text-left px-5 py-3">Produit</th>
                  <th className="text-left px-5 py-3">Montant</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-300">
                    <Package size={28} className="mx-auto mb-2" />
                    Aucune commande trouvée
                  </td></tr>
                )}
                {orders.map((o) => {
                  const s = STATUS[o.status] ?? STATUS.pending;
                  const Icon = s.icon;
                  return (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{o.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{o.customer}</td>
                      <td className="px-5 py-3.5 text-gray-600">{o.product}</td>
                      <td className="px-5 py-3.5 font-bold text-green-600">{Number(o.amount).toLocaleString('fr-FR')} F</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${s.color}`}>
                          <Icon size={10} /> {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{o.date}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setSelected(o)} className="text-gray-400 hover:text-gray-600 transition">
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-gray-900 mb-1">{selected.id}</h3>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mb-4 ${(STATUS[selected.status] ?? STATUS.pending).color}`}>
              {(STATUS[selected.status] ?? STATUS.pending).label}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Client</span><span className="font-semibold">{selected.customer}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Produit</span><span className="font-semibold">{selected.product}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Montant</span><span className="font-bold text-green-600">{Number(selected.amount).toLocaleString('fr-FR')} F</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Date</span><span>{selected.date}</span></div>
            </div>
            <button onClick={() => setSelected(null)} className="w-full mt-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
