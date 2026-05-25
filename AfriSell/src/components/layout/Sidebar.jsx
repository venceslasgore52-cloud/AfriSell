import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bot, LayoutDashboard, Package, ShoppingCart, Receipt,
  Settings, LogOut, Menu, X, ChevronRight, Zap, Sparkles,
  Send, Lock, Users, Store, BarChart2, Shield, CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

const VENDOR_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    to: '/dashboard',               free: true,  exact: true  },
  { icon: Package,         label: 'Produits',     to: '/products',               free: true  },
  { icon: Sparkles,        label: 'Studio IA',    to: '/dashboard/ai',           free: false },
  { icon: Send,            label: 'Publications', to: '/publications',           free: false },
  { icon: ShoppingCart,    label: 'Commandes',    to: '/orders',                 free: false },
  { icon: Bot,             label: 'Bot Client',   to: '/dashboard/conversations', free: false },
  { icon: Receipt,         label: 'Facturation',  to: '/billing',                free: true  },
  { icon: Settings,        label: 'Paramètres',   to: '/dashboard/settings',     free: true  },
];

const ADMIN_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    to: '/admin',              free: true, exact: true },
  { icon: Store,           label: 'Vendeurs',     to: '/admin/vendors',      free: true },
  { icon: Users,           label: 'Utilisateurs', to: '/admin/users',        free: true },
  { icon: Package,         label: 'Produits',     to: '/admin/products',     free: true },
  { icon: ShoppingCart,    label: 'Commandes',    to: '/admin/orders',       free: true },
  { icon: BarChart2,       label: 'Analytiques',  to: '/admin/analytics',    free: true },
  { icon: CreditCard,      label: 'Passerelles',  to: '/admin/gateways',     free: true },
  { icon: Receipt,         label: 'Facturation',  to: '/billing',            free: true },
  { icon: Settings,        label: 'Paramètres',   to: '/dashboard/settings', free: true },
];

function NavContent({ user, isAdmin, isFree, navItems, isActive, onLockedClick, onClose, openUpgradeModal, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2.5 text-green-700 font-bold text-lg">
          <div className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center">
            <Bot size={18} />
          </div>
          <span className="tracking-tight">Afrisell</span>
        </Link>
        {isAdmin && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-700 font-semibold bg-purple-50 border border-purple-200 rounded-lg px-2 py-1 w-fit">
            <Shield size={11} />
            Admin
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, to, soon, free, exact }) => {
          const locked = !isAdmin && isFree && free === false;
          const active = isActive(to, exact);

          if (soon) {
            return (
              <div
                key={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 cursor-not-allowed"
              >
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-semibold">
                  Bientôt
                </span>
              </div>
            );
          }

          if (locked) {
            return (
              <button
                key={to}
                onClick={onLockedClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 transition group"
              >
                <Icon size={17} />
                <span className="flex-1 text-left">{label}</span>
                <Lock size={13} className="text-gray-300 group-hover:text-amber-400 transition" />
              </button>
            );
          }

          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Plan badge — vendeur seulement */}
      {!isAdmin && (
        <div className="mx-3 mb-3">
          {isFree ? (
            <button
              onClick={() => openUpgradeModal('feature')}
              className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-amber-100 transition text-left"
            >
              <Zap size={16} className="text-amber-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-700">Plan Gratuit</div>
                <span className="text-xs text-amber-500">Passer à un plan payant →</span>
              </div>
            </button>
          ) : (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <Zap size={16} className="text-green-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-green-700 capitalize">
                  Plan {user?.plan || 'Starter'}
                </div>
                <Link to="/billing" className="text-xs text-green-500 hover:underline">
                  Gérer mon abonnement →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {user?.name || 'Utilisateur'}
            </div>
            <div className="text-xs text-gray-400 truncate">{user?.email || ''}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={17} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export default function VerticalNavbar() {
  const { user, logout, isFree, openUpgradeModal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isAdmin   = user?.role === 'admin';
  const navItems  = isAdmin ? ADMIN_NAV : VENDOR_NAV;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (to, exact = false) =>
    exact ? location.pathname === to : (location.pathname === to || location.pathname.startsWith(to + '/'));

  const handleLockedClick = (e) => {
    e.preventDefault();
    openUpgradeModal('feature');
  };

  const navProps = {
    user,
    isAdmin,
    isFree,
    navItems,
    isActive,
    onLockedClick: handleLockedClick,
    onClose: () => setOpen(false),
    openUpgradeModal,
    onLogout: handleLogout,
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-40">
        <NavContent {...navProps} />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative w-64 bg-white z-50 flex flex-col shadow-xl">
            <NavContent {...navProps} />
          </aside>
        </div>
      )}
    </>
  );
}
