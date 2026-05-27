import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Drawer latéral réutilisable pour les détails admin.
 * Usage : <DetailDrawer open={!!selected} onClose={() => setSelected(null)} title="…">…</DetailDrawer>
 */
export default function DetailDrawer({ open, onClose, title, subtitle, children }) {
  // Ferme avec Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Bloque le scroll du body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition shrink-0 mt-0.5"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </>
  )
}

/* ── Helpers de mise en forme utilisés dans les drawers ────────────────────── */
export function Field({ label, value, mono = false }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm text-gray-800 break-words ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
    </div>
  )
}

export function Section({ title, children }) {
  return (
    <div className="mb-6">
      {title && (
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  )
}

export function Divider() {
  return <div className="h-px bg-gray-100 my-5" />
}
