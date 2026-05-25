import { api } from './api'

export const socialConnectionService = {
  getStatus:   ()         => api.get('/api/accounts/social/connections/'),
  connect:     (platform) => api.post(`/api/accounts/social/connect/${platform}/`),
  disconnect:  (platform) => api.delete(`/api/accounts/social/connect/${platform}/`),
}
