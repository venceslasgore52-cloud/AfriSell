import { api } from './api'

export const siraService = {
  config:        (signal) => api.get('/api/sira/me/config/', signal),
  updateConfig:  (data)   => api.patch('/api/sira/me/config/', data),
  conversations: (signal) => api.get('/api/sira/me/conversations/', signal),
  conversation:  (id)     => api.get(`/api/sira/me/conversations/${id}/`),
  stats:         (signal) => api.get('/api/sira/me/stats/', signal),
}
