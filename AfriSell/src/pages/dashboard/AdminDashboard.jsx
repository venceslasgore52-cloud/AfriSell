import { useState, useEffect } from 'react';
import {
  Users, CreditCard, TrendingUp, Store,
  ArrowUpRight, Search, Shield, Loader2, CheckCircle, XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';

const COLOR_MAP = {
  blue:   'bg-blue-100 text-blue-600',
  green:  'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
};

const ROLE_LABELS = { tenant: 'Vendeur', admin: 'Admin', user: 'Utilisateur' };
const ROLE_STYLES = {
  tenant: 'bg-green-100 text-green-700',
  admin:  'bg-purple-100 text-purple-700',
  user:   'bg-gray-100 text-gray-600',
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminDashboard() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      adminService.listUsers(),
      adminService.listVendors(),
    ]).then(([usersRes, vendorsRes]) => {
      if (!active) return;
      // Prefer full users list; fallback to vendors if users fails
      if (usersRes.status === 'fulfilled' && usersRes.value?.length > 0) {
        setUsers(usersRes.value);
      } else if (vendorsRes.status === 'fulfilled') {
        setUsers(vendorsRes.value);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  // Stats calculées depuis la vraie liste
  const totalUsers   = users.length;
  const totalVendors = users.filter(u => u.role === 'tenant').length;
  const activeSubs   = users.filter(u => u.has_active_subscription).length;

  const STATS = [
    { icon: Users,      label: 'Utilisateurs',       value: totalUsers,   color: 'blue',   to: '/admin/users'    },
    { icon: Store,      label: 'Vendeurs',            value: totalVendors, color: 'green',  to: '/admin/vendors'  },
    { icon: CreditCard, label: 'Abonnés actifs',      value: activeSubs,   color: 'purple', to: '/admin/vendors'  },
    { icon: TrendingUp, label: 'Taux d\'abonnement',  value: totalVendors > 0 ? `${Math.round((activeSubs / totalVendors) * 100)}%` : '—', color: 'orange', to: null },
  ];

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = (u.username || u.email || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2 md:pt-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Administration</h1>
            <p className="text-sm text-gray-500 mt-0.5">Vue globale de la plateforme AfriSell</p>
          </div>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded-full">
          Admin
        </span>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {STATS.map(({ icon: Icon, label, value, color, to }) => {
          const card = (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">{label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${COLOR_MAP[color]}`}>
                  <Icon size={18} />
                </div>
              </div>
              {loading ? (
                <div className="h-7 w-20 bg-gray-100 rounded animate-pulse" />
              ) : (
                <div className="flex items-end gap-2">
                  <div className="text-xl font-black text-gray-900">{value}</div>
                  {to && <ArrowUpRight size={14} className="text-gray-300 mb-0.5" />}
                </div>
              )}
            </div>
          );
          return to
            ? <Link key={label} to={to}>{card}</Link>
            : <div key={label}>{card}</div>;
        })}
      </div>

      {/* Tableau utilisateurs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            Utilisateurs
            {!loading && <span className="ml-2 text-sm text-gray-400 font-normal">({totalUsers})</span>}
          </h2>
          <div className="flex gap-2 flex-wrap">
            {/* Filtre rôle */}
            {['', 'tenant', 'admin', 'user'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                  ${roleFilter === r ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {r === '' ? 'Tous' : ROLE_LABELS[r] ?? r}
              </button>
            ))}
            {/* Recherche */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="pl-8 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-purple-400 transition w-44"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 font-semibold border-b border-gray-100">
                  <th className="px-5 py-3">Utilisateur</th>
                  <th className="px-5 py-3">Rôle</th>
                  <th className="px-5 py-3">Téléphone</th>
                  <th className="px-5 py-3">Abonnement</th>
                  <th className="px-5 py-3">Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {(u.username || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{u.username || '—'}</div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_STYLES[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {u.phone || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.has_active_subscription
                        ? <span className="flex items-center gap-1.5 text-green-600 text-xs font-semibold"><CheckCircle size={13} /> Actif</span>
                        : <span className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold"><XCircle size={13} /> Inactif</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{fmtDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">Aucun utilisateur trouvé.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
