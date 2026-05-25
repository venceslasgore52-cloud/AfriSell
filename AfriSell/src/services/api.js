// Client HTTP central — toutes les requêtes passent ici.
// Avec le proxy Vite, BASE est vide en dev (URLs relatives /api/...).
// En production, VITE_API_BASE_URL pointe vers le backend déployé.
const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function getToken() {
  return localStorage.getItem('token')
}

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Token ${token}`
  return headers
}

function extractMessage(data) {
  if (!data || typeof data === 'string') return data || 'Erreur inconnue'
  if (data.detail) return data.detail
  if (data.non_field_errors) return data.non_field_errors[0]
  const key = Object.keys(data)[0]
  if (key) {
    const val = data[key]
    return Array.isArray(val) ? `${key} : ${val[0]}` : String(val)
  }
  return 'Une erreur est survenue'
}

async function request(method, path, body, signal) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  if (res.status === 204) return null

  // Session expirée — nettoyer et rediriger
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.replace('/auth/login')
    return
  }

  let data
  try {
    data = await res.json()
  } catch {
    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    return null
  }

  if (!res.ok) throw new Error(extractMessage(data))
  return data
}

export const api = {
  get:    (path, signal)       => request('GET',    path, undefined, signal),
  post:   (path, body, signal) => request('POST',   path, body,      signal),
  patch:  (path, body, signal) => request('PATCH',  path, body,      signal),
  put:    (path, body, signal) => request('PUT',    path, body,      signal),
  delete: (path, signal)       => request('DELETE', path, undefined, signal),
}
