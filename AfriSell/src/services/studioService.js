import { api } from './api'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function multipartAsset(data) {
  const token = localStorage.getItem('token')
  const headers = {}
  if (token) headers['Authorization'] = `Token ${token}`

  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') fd.append(k, v)
  })

  const res = await fetch(`${BASE}/api/studio/assets/`, { method: 'POST', headers, body: fd })

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
    if (json.detail) throw new Error(json.detail)
    const msgs = Object.entries(json).map(([f, e]) => `${f} : ${Array.isArray(e) ? e[0] : e}`).join(' · ')
    throw new Error(msgs || 'Erreur serveur')
  }
  return json
}

export const studioService = {
  quota:        (signal) => api.get('/api/studio/quota/', signal),
  generateText: (data)   => api.post('/api/studio/generate-text/', data),
  assets:       (signal) => api.get('/api/studio/assets/', signal),
  getAsset:     (id)     => api.get(`/api/studio/assets/${id}/`),
  deleteAsset:  (id)     => api.delete(`/api/studio/assets/${id}/`),
  createAsset:  (data)   => multipartAsset(data),

  posts:        (signal) => api.get('/api/studio/posts/', signal),
  createPost:   (data)   => api.post('/api/studio/posts/', data),
  updatePost:   (id, d)  => api.patch(`/api/studio/posts/${id}/`, d),
  deletePost:   (id)     => api.delete(`/api/studio/posts/${id}/`),

  pollAsset(id, onDone, onError, intervalMs = 2500, maxMs = 90000) {
    const start   = Date.now()
    const timer   = setInterval(async () => {
      try {
        const asset = await studioService.getAsset(id)
        if (asset.status === 'done')   { clearInterval(timer); onDone(asset)  }
        if (asset.status === 'failed') { clearInterval(timer); onError(asset.error_message || 'Génération échouée.') }
        if (Date.now() - start > maxMs) { clearInterval(timer); onError('Délai dépassé — réessayez.') }
      } catch (e) {
        clearInterval(timer)
        onError(e.message)
      }
    }, intervalMs)
    return () => clearInterval(timer)
  },
}
