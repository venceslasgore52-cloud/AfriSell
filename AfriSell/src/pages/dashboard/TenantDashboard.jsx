import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ShoppingCart, Package, CreditCard,
  Plus, Eye, ArrowUpRight, Bot,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { dashboardService } from '../../services/dashboardService';

const STATUS_STYLES = {
  delivered:  'bg-green-100 text-green-700',
  confirmed:  'bg-blue-100 text-blue-700',
  pending:    'bg-yellow-100 text-yellow-700',
  cancelled:  'bg-red-100 text-red-700',
  shipped:    'bg-indigo-100 text-indigo-700',
};

const STATUS_LABELS = {
  delivered:  'Livré',
  confirmed:  'Confirmé',
  pending:    'En attente',
  cancelled:  'Annulé',
  shipped:    'Expédié',
};

const colorMap = {
  green:  'bg-green-100 text-green-600',
  blue:   'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
};

const fmt = (val) => {
  if (val == null) return '—';
  return Number(val).toLocaleString('fr-FR');
};

export default function TenantDashboard() {
  const { user } = useAuth();
  const [period, setPeriod]     = useState('mois');
  const [stats, setStats]       = useState(null);
  const [orders, setOrders]     = useState([]);
  const [botStats, setBotStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      dashboardService.getStats(),
      dashboardService.getRecentOrders(),
      dashboardService.getBotStats(),
    ]).then(([statsRes, ordersRes, botRes]) => {
      if (!active) return;
      if (statsRes.status === 'fulfilled' && statsRes.value != null)
        setStats(statsRes.value);
      if (ordersRes.status === 'fulfilled' && ordersRes.value != null) {
        const d = ordersRes.value;
        setOrders(Array.isArray(d) ? d : (d?.results ?? []));
      }
      if (botRes.status === 'fulfilled' && botRes.value != null)
        setBotStats(botRes.value);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { active = false; };
  }, []);

  // Sélectionne les valeurs selon la période choisie
  const revenue     = period === 'jour' ? stats?.revenue_today   : stats?.revenue_month;
  const ordersCount = period === 'jour' ? stats?.orders_today    : stats?.orders_month;
  const avgCart     = ordersCount > 0 ? Math.round(revenue / ordersCount) : null;

  const STATS_CARDS = [
    {
      icon: TrendingUp,  label: 'Revenus',        value: revenue,             suffix: ` ${stats?.currency ?? 'XOF'}`, color: 'green',
    },
    {
      icon: ShoppingCart,label: 'Commandes',       value: ordersCount,         suffix: '',      color: 'blue',
    },
    {
      icon: Package,     label: 'Produits actifs', value: stats?.total_products, suffix: '',    color: 'purple',
    },
    {
      icon: CreditCard,  label: 'Panier moyen',    value: avgCart,             suffix: ` ${stats?.currency ?? 'XOF'}`, color: 'orange',
    },
  ];

  // Bot: active si au moins une conversation existante
  const botActive  = (botStats?.total_conversations ?? 0) > 0;
  const botTotal   = botStats?.total_conversations ?? null;
  const botDone    = botStats?.completed ?? null;
  const botRate    = botTotal > 0 ? Math.round((botDone / botTotal) * 100) : null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2 md:pt-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Bonjour, {user?.name?.split(' ')[0] || 'Marchand'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Voici un résumé de votre activité</p>
        </div>
        <Link
          to="/products/add"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition"
        >
          <Plus size={16} />
          Nouveau produit
        </Link>
      </div>

      {/* Period toggle */}
      <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 mb-6">
        {['jour', 'mois'].map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition
              ${period === p ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
            {p === 'jour' ? "Aujourd'hui" : 'Ce mois'}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {STATS_CARDS.map(({ icon: Icon, label, value, suffix, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">{label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                <Icon size={18} />
              </div>
            </div>
            {loading ? (
              <div className="h-7 w-24 bg-gray-100 rounded animate-pulse" />
            ) : (
              <div className="text-xl font-black text-gray-900">
                {value != null ? `${fmt(value)}${suffix}` : '—'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent orders + Bot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Commandes récentes */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Commandes récentes</h2>
            <Link to="/orders" className="text-sm text-green-600 font-semibold hover:underline flex items-center gap-1">
              Voir tout <Eye size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <ShoppingCart size={32} className="mb-2 text-gray-200" />
              <p className="text-sm">Aucune commande pour l'instant.</p>
              <p className="text-xs mt-1">Les commandes WhatsApp apparaîtront ici.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 font-semibold border-b border-gray-100">
                    <th className="pb-3">Réf.</th>
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Articles</th>
                    <th className="pb-3">Montant</th>
                    <th className="pb-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 font-mono text-xs text-gray-500">
                        {o.reference ?? String(o.id).slice(0, 8)}
                      </td>
                      <td className="py-3 font-medium text-gray-800">{o.client_name}</td>
                      <td className="py-3 text-gray-500">{o.items_count} art.</td>
                      <td className="py-3 font-semibold text-gray-900">
                        {Number(o.total_amount).toLocaleString('fr-FR')} {o.currency ?? 'F'}
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bot WhatsApp */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <h2 className="font-bold text-gray-900 mb-4">Bot WhatsApp</h2>
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                {loading
                  ? <span className="w-16 h-4 bg-green-200 rounded animate-pulse inline-block" />
                  : (
                    <>
                      <span className={`w-2 h-2 rounded-full ${botStats ? (botActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-400') : 'bg-gray-300'}`} />
                      <span className="text-sm font-bold text-green-700">
                        {botStats == null ? 'Non configuré' : botActive ? 'Actif' : 'En veille'}
                      </span>
                    </>
                  )
                }
              </div>
              <span className="text-xs text-green-600">Répond en temps réel</span>
            </div>
          </div>

          <div className="space-y-3 text-sm flex-1">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
              ))
            ) : (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Conversations (30j)</span>
                  <span className="font-bold text-gray-900">{botTotal ?? '—'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Commandes complétées</span>
                  <span className="font-bold text-gray-900">{botDone ?? '—'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taux de conversion</span>
                  <span className="font-bold text-green-600">
                    {botRate != null ? `${botRate}%` : '—'}
                  </span>
                </div>
              </>
            )}
          </div>

          <Link
            to="/dashboard/conversations"
            className="mt-4 w-full py-2.5 border border-green-600 text-green-600 rounded-xl text-sm font-bold hover:bg-green-50 transition text-center block"
          >
            Configurer le bot
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/products/add"
          className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-green-300 hover:shadow-sm transition group">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition">
            <Package size={18} className="text-green-600" />
          </div>
          <p className="font-bold text-gray-900 text-sm">Ajouter un produit</p>
          <p className="text-xs text-gray-400 mt-0.5">Enrichissez votre catalogue</p>
        </Link>
        <Link to="/dashboard/ai"
          className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-purple-300 hover:shadow-sm transition group">
          <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-200 transition">
            <TrendingUp size={18} className="text-purple-600" />
          </div>
          <p className="font-bold text-gray-900 text-sm">Studio IA</p>
          <p className="text-xs text-gray-400 mt-0.5">Générer du contenu marketing</p>
        </Link>
        <Link to="/publications"
          className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition group">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
            <ArrowUpRight size={18} className="text-blue-600" />
          </div>
          <p className="font-bold text-gray-900 text-sm">Publier</p>
          <p className="text-xs text-gray-400 mt-0.5">Planifier vos publications</p>
        </Link>
      </div>
    </div>
  );
}
