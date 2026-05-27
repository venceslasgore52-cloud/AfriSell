import { api } from './api'

export const dashboardService = {
  getStats:        () => api.get('/api/stats/dashboard/'),
  getRecentOrders: () => api.get('/api/orders/me/?ordering=-created_at&page_size=5'),
  getBotStats:     () => api.get('/api/sira/me/stats/'),
}
