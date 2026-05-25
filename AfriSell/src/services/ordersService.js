import { api } from './api'

export const ordersService = {
  list:         (params = '', signal) => api.get(`/api/orders/me/${params}`, signal),
  get:          (id)                  => api.get(`/api/orders/me/${id}/`),
  stats:        (signal)              => api.get('/api/orders/me/stats/', signal),
  updateStatus: (id, status)          => api.patch(`/api/orders/me/${id}/status/`, { status }),
  addNote:      (id, note)            => api.patch(`/api/orders/me/${id}/note/`, { note }),
}
