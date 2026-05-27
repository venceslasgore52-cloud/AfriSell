import { useState, useEffect } from 'react'
import { Users, Search, Loader2, Shield, Store, Mail, Phone, MapPin,
         Calendar, CheckCircle2, XCircle, CreditCard, User } from 'lucide-react'
import { api } from '../../services/api'
import DetailDrawer, { Field, Section, Divider } from '../../components/admin/DetailDrawer'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Avatar({ user, size = 'md' }) {
  const dim = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-9 h-9 text-sm'
  const bg  = user.role === 'admin' ? 'bg-purple-600' : 'bg-green-600'
  return (
    <div className={`${dim} ${bg} rounded-full flex items-center justify-center font-bold text-white shrink-0`}>
      {(user.username || user.email || '?')[0].toUpperCase()}
    </div>
  )
}

/* ── Drawer contenu utilisateur ─────────────────────────────────────────────── */
function UserDrawer({ user }) {
  if (!user) return null
  const isAdmin = user.role === 'admin'

  return (
    <>
      {/* Profil */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
        <Avatar user={user} size="lg" />
        <div>
          <p className="font-bold text-gray-900 text-base">{user.username || '—'}</p>
          <p className="text-sm text-gray-400">{user.email}</p>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-1.5 px-2.5 py-0.5 rounded-full ${
            isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
          }`}>
            {isAdmin ? <Shield size={10} /> : <Store size={10} />}
            {isAdmin ? 'Administrateur' : 'Vendeur'}
          </span>
        </div>
      </div>

      <Section title="Coordonnées">
        <Field label="Email"     value={user.email} />
        <Field label="Téléphone" value={user.phone || '—'} />
        <Field label="Pays"      value={user.country || '—'} />
        <Field label="Ville"     value={user.city || '—'} />
      </Section>

      <Divider />

      <Section title="Compte">
        <Field label="Nom d'utilisateur" value={user.username} />
        <Field label="Rôle"              value={isAdmin ? 'Administrateur' : 'Vendeur'} />
        <Field label="Inscription"       value={fmtDate(user.created_at)} />
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Statut</p>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            user.is_active !== false ? 'text-green-600' : 'text-gray-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${user.is_active !== false ? 'bg-green-500' : 'bg-gray-300'}`} />
            {user.is_active !== false ? 'Compte actif' : 'Compte inactif'}
          </span>
        </div>
      </Section>

      {!isAdmin && (
        <>
          <Divider />
          <Section title="Abonnement">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Statut</p>
              {user.has_active_subscription ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={11} /> Abonnement actif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  <XCircle size={11} /> Plan gratuit
                </span>
              )}
            </div>
            {user.subscription_plan && <Field label="Plan" value={user.subscription_plan} />}
          </Section>

          {(user.shop_name || user.shop_slug) && (
            <>
              <Divider />
              <Section title="Boutique">
                <Field label="Nom"     value={user.shop_name} />
                <Field label="Slug"    value={user.shop_slug} mono />
                <Field label="Secteur" value={user.shop_category} />
              </Section>
            </>
          )}
        </>
      )}
    </>
  )
}

/* ── Page principale ─────────────────────────────────────────────────────────── */
export default function AdminUsers() {
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [error, setError]         = useState('')
  const [selected, setSelected]   = useState(null)

  useEffect(() => {
    const ctrl = new AbortController()
    const params = roleFilter ? `?role=${roleFilter}` : ''
    api.get(`/api/accounts/admin/users/${params}`, ctrl.signal)
      .then(data => setUsers(Array.isArray(data) ? data : (data?.results ?? [])))
      .catch(err => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [roleFilter])

  const filtered = users.filter(u =>
    (u.username || u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users size={22} className="text-purple-600" /> Utilisateurs
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {users.length} utilisateur{users.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[{ key: '', label: 'Tous' }, { key: 'admin', label: 'Admins' }, { key: 'tenant', label: 'Vendeurs' }].map(({ key, label }) => (
                <button key={key} onClick={() => setRoleFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    roleFilter === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="relative w-56">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="text-purple-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Users size={40} className="mb-3 text-gray-200" />
              <p className="text-sm">Aucun utilisateur trouvé.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-semibold">Utilisateur</th>
                    <th className="text-left px-5 py-3 font-semibold">Rôle</th>
                    <th className="text-left px-5 py-3 font-semibold">Abonnement</th>
                    <th className="text-left px-5 py-3 font-semibold">Inscription</th>
                    <th className="text-left px-5 py-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(u => (
                    <tr
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className="hover:bg-gray-50/70 transition cursor-pointer group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar user={u} />
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-purple-700 transition">
                              {u.username || '—'}
                            </div>
                            <div className="text-xs text-gray-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {u.role === 'admin' ? <Shield size={11} /> : <Store size={11} />}
                          {u.role === 'admin' ? 'Admin' : 'Vendeur'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          u.has_active_subscription ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.has_active_subscription ? 'Actif' : 'Gratuit'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                          u.is_active !== false ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active !== false ? 'bg-green-500' : 'bg-gray-300'}`} />
                          {u.is_active !== false ? 'Actif' : 'Inactif'}
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
        title={selected?.username || selected?.email || 'Utilisateur'}
        subtitle={selected ? `ID ${selected.id}` : ''}
      >
        <UserDrawer user={selected} />
      </DetailDrawer>
    </>
  )
}
