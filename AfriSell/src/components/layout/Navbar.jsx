import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Bot, Menu, X } from 'lucide-react'

const links = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#how' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'Témoignages', href: '#testimonials' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
            <Bot size={16} className="text-white" />
          </div>
          AfriSell
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <li key={l.label}>
              <a href={l.href} className="text-gray-600 hover:text-green-600 text-sm font-medium transition-colors">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
            Connexion
          </Link>
          <Link
            to="/auth/register"
            className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-md shadow-green-100 hover:-translate-y-0.5"
          >
            Commencer gratuitement
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              {links.map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-gray-700 font-medium hover:text-green-600 transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                <Link to="/auth/login" onClick={() => setOpen(false)} className="text-center text-gray-600 font-medium py-2">Connexion</Link>
                <Link
                  to="/auth/register"
                  onClick={() => setOpen(false)}
                  className="bg-green-500 text-white font-semibold py-3 rounded-xl text-center hover:bg-green-600 transition-colors"
                >
                  Commencer gratuitement
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
