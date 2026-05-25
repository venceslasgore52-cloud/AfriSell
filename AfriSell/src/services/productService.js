import { api } from './api'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function toFormData(data) {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') fd.append(k, v)
  })
  return fd
}

async function multipartRequest(method, path, data) {
  const token = localStorage.getItem('token')
  const headers = {}
  if (token) headers['Authorization'] = `Token ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: toFormData(data),
  })

  if (res.status === 204) return null

  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.replace('/auth/login')
    return
  }

  let json
  try { json = await res.json() } catch {
    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    return null
  }

  if (!res.ok) {
    // Extraire tous les messages d'erreur du serveur
    if (json.detail) throw new Error(json.detail)
    if (json.non_field_errors) throw new Error(json.non_field_errors[0])
    const msgs = Object.entries(json)
      .map(([field, errs]) => {
        const msg = Array.isArray(errs) ? errs[0] : String(errs)
        return `${field} : ${msg}`
      })
      .join(' · ')
    throw new Error(msgs || 'Erreur serveur')
  }
  return json
}

function normalizeList(data) {
  if (Array.isArray(data)) return data
  if (data?.results) return data.results
  return []
}

export const productService = {
  list:   ()         => api.get('/api/catalogue/me/').then(normalizeList),
  get:    (id)       => api.get(`/api/catalogue/me/${id}/`),
  create: (data)     => multipartRequest('POST',  '/api/catalogue/me/', data),
  update: (id, data) => multipartRequest('PATCH', `/api/catalogue/me/${id}/`, data),
  delete: (id)       => api.delete(`/api/catalogue/me/${id}/`),

  toggleStatus: (id, currentStatut) =>
    api.patch(`/api/catalogue/me/${id}/`, {
      statut: currentStatut === 'active' ? 'inactive' : 'active',
    }),
}
