import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'

/* ── Pages publiques ──────────────────────────────────── */
const Home           = lazy(() => import('./pages/Home'))
const PrivacyPolicy  = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))

/* ── Pages auth ───────────────────────────────────────── */
const Login            = lazy(() => import('./pages/auth/Login'))
const Register         = lazy(() => import('./pages/auth/Register'))
const VerifyOTP        = lazy(() => import('./pages/auth/verifyOTP'))
const PasswordChange   = lazy(() => import('./pages/auth/PasswordChange'))
const PasswordValidate = lazy(() => import('./pages/auth/PasswordValidate'))
const VerifyEmail      = lazy(() => import('./pages/auth/VerifyEmail'))
const ShopSetup        = lazy(() => import('./pages/auth/ShopSetup'))

/* ── Pages dashboard vendeur ──────────────────────────── */
const VendorDashboard = lazy(() => import('./pages/dashboard/TenantDashboard'))
const Setting         = lazy(() => import('./pages/dashboard/Setting'))
const ListProd        = lazy(() => import('./pages/products/ListProd'))
const AjouterProd     = lazy(() => import('./pages/products/AjouterProd'))
const EditProd        = lazy(() => import('./pages/products/EditProd'))
const Orders          = lazy(() => import('./pages/orders/Orders'))
const Billing         = lazy(() => import('./pages/billing/Billing'))
const PaymentSuccess  = lazy(() => import('./pages/billing/PaymentSuccess'))
const PaymentCancel   = lazy(() => import('./pages/billing/PaymentCancel'))
const Studio          = lazy(() => import('./pages/studio/Studio'))
const Publication     = lazy(() => import('./pages/publication/Publication'))
const Conversations   = lazy(() => import('./pages/bot/Conversations'))

/* ── Pages dashboard admin ────────────────────────────── */
const AdminDashboard  = lazy(() => import('./pages/dashboard/AdminDashboard'))
const Vendors         = lazy(() => import('./pages/admin/Vendors'))
const AdminProducts   = lazy(() => import('./pages/admin/AdminProducts'))
const AdminOrders     = lazy(() => import('./pages/admin/AdminOrders'))
const AdminUsers      = lazy(() => import('./pages/admin/AdminUsers'))
const AdminAnalytics  = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminGateways   = lazy(() => import('./pages/admin/AdminGateways'))

/* ── Layout ───────────────────────────────────────────── */
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'))

/* ── Loader ───────────────────────────────────────────── */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

/* ── Guards ───────────────────────────────────────────────────────────────────
   On attend que l'AuthContext finisse de restaurer la session (loading) avant
   de décider si l'utilisateur est connecté ou non — évite le flash de redirect.
────────────────────────────────────────────────────────────────────────────── */
function PrivateRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user ? <Outlet /> : <Navigate to="/auth/login" replace />
}

function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  // Redirige selon le rôle si déjà connecté
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  return <Outlet />
}

function AdminRoute() {
  const { user } = useAuth()
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />
}

/* ── App ──────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* Pages publiques */}
            <Route path="/" element={<Home />} />
            <Route path="/privacy-policy"   element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />

            {/* Auth — accessible seulement si non connecté */}
            <Route element={<GuestRoute />}>
              <Route path="/auth/login"           element={<Login />} />
              <Route path="/auth/register"        element={<Register />} />
              <Route path="/auth/verify-otp"      element={<VerifyOTP />} />
              <Route path="/auth/forgot-password" element={<PasswordChange />} />
              <Route path="/auth/reset-password"  element={<PasswordValidate />} />
              <Route path="/auth/verify-email"    element={<VerifyEmail />} />
              <Route path="/auth/shop-setup"      element={<ShopSetup />} />
            </Route>

            {/* Dashboard — accessible seulement si connecté */}
            <Route element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>

                {/* Vendeur (role=tenant) */}
                <Route path="/dashboard"          element={<VendorDashboard />} />
                <Route path="/dashboard/settings" element={<Setting />} />

                {/* Admin (role=admin) */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>

                {/* Pages vendeur */}
                <Route path="/products"                element={<ListProd />} />
                <Route path="/products/add"            element={<AjouterProd />} />
                <Route path="/products/edit/:id"       element={<EditProd />} />
                <Route path="/orders"                  element={<Orders />} />
                <Route path="/publications"            element={<Publication />} />
                <Route path="/billing"                 element={<Billing />} />
                <Route path="/billing/success"        element={<PaymentSuccess />} />
                <Route path="/billing/cancel"         element={<PaymentCancel />} />
                <Route path="/dashboard/ai"            element={<Studio />} />
                <Route path="/dashboard/conversations" element={<Conversations />} />

                {/* Pages admin */}
                <Route path="/admin/vendors"           element={<Vendors />} />
                <Route path="/admin/products"          element={<AdminProducts />} />
                <Route path="/admin/orders"            element={<AdminOrders />} />
                <Route path="/admin/users"             element={<AdminUsers />} />
                <Route path="/admin/analytics"         element={<AdminAnalytics />} />
                <Route path="/admin/gateways"          element={<AdminGateways />} />

              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

function ComingSoon({ label }) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-4xl mb-3">🚧</div>
        <h2 className="text-xl font-bold text-gray-900">{label}</h2>
        <p className="text-gray-400 text-sm mt-1">Cette page est en cours de développement.</p>
      </div>
    </div>
  )
}
