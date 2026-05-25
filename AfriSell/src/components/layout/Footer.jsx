import { Bot } from 'lucide-react'

const cols = [
  {
    title: 'Produit',
    links: ['Fonctionnalités', 'Tarifs', 'Documentation', 'Changelog'],
  },
  {
    title: 'Entreprise',
    links: ['À propos', 'Blog', 'Carrières', 'Presse'],
  },
  {
    title: 'Support',
    links: ["Centre d'aide", 'Statut', 'Contact', 'CGU & Confidentialité'],
  },
]

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg">AfriSell</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              La plateforme WhatsApp IA pour les commerçants africains.
            </p>
            <div className="flex gap-3">
              {['🇸🇳', '🇨🇮', '🇳🇬', '🇬🇭', '🇲🇦'].map(f => (
                <span key={f} className="text-xl">{f}</span>
              ))}
            </div>
          </div>

          {cols.map(col => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm hover:text-green-400 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 AfriSell. Tous droits réservés.</p>
          <p className="flex items-center gap-1">
            Propulsé par <span className="text-green-400 font-medium">Claude (Anthropic)</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
