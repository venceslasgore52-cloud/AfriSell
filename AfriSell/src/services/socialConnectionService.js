import { api } from './api'

export const socialConnectionService = {
  getStatus:   ()         => api.get('/api/accounts/me/social/'),
  disconnect:  (id)       => api.delete(`/api/accounts/me/social/${id}/`),
}
