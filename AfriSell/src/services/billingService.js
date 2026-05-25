import { api } from './api'

export const billingService = {
  plans:        (signal) => api.get('/api/billing/plans/', signal),
  subscription: (signal) => api.get('/api/billing/subscription/', signal),
  payments:     (signal) => api.get('/api/billing/payments/', signal),
  invoices:     (signal) => api.get('/api/billing/invoices/', signal),
  checkout:     (data)   => api.post('/api/billing/checkout/', data),
}
