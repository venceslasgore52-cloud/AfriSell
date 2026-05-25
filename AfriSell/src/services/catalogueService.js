import { api } from './api'

export const catalogueService = {
  list:    (signal)        => api.get('/api/catalogue/me/', signal),
  get:     (id)            => api.get(`/api/catalogue/me/${id}/`),
  create:  (data)          => api.post('/api/catalogue/me/', data),
  update:  (id, data)      => api.patch(`/api/catalogue/me/${id}/`, data),
  remove:  (id)            => api.delete(`/api/catalogue/me/${id}/`),
  publish: (id)            => api.post(`/api/catalogue/me/${id}/publish/`),
  stock:   (id, data)      => api.patch(`/api/catalogue/me/${id}/stock/`, data),
}
