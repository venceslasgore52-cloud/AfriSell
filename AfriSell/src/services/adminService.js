import { api } from './api'

function normalize(data) {
  if (Array.isArray(data)) return data
  if (data?.results) return data.results
  return []
}

export const adminService = {
  listVendors:    () => api.get('/api/accounts/admin/vendors/').then(normalize),
  listUsers:      () => api.get('/api/accounts/admin/users/').then(normalize),
  listOrders:     () => api.get('/api/orders/admin/').then(normalize),
  listProducts:   () => api.get('/api/catalogue/admin/').then(normalize),
  listGateways:   () => api.get('/api/billing/admin/gateways/').then(data => Array.isArray(data) ? data : []),
  toggleGateway:  (provider, is_enabled) => api.patch(`/api/billing/admin/gateways/${provider}/`, { is_enabled }),
}
