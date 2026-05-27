export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center font-black text-white text-lg">A</div>
            <span className="font-bold text-xl">AfriSell</span>
          </div>
          <h1 className="text-3xl font-black">Politique de Confidentialité</h1>
          <p className="text-gray-400 mt-2 text-sm">Dernière mise à jour : mai 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
          <p>
            AfriSell (« nous », « notre ») est une plateforme SaaS de commerce en ligne destinée aux vendeurs africains.
            La présente Politique de Confidentialité décrit comment nous collectons, utilisons et protégeons vos données
            personnelles lorsque vous utilisez notre service, notamment dans le cadre de l'intégration WhatsApp / Meta
            Business Platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Données collectées</h2>
          <p className="mb-3">Nous collectons les informations suivantes :</p>
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li><strong>Données de compte :</strong> nom, adresse e-mail, numéro de téléphone, pays.</li>
            <li><strong>Données de boutique :</strong> nom, logo, description, adresse, réseaux sociaux.</li>
            <li><strong>Données de catalogue :</strong> produits, prix, images, stock.</li>
            <li><strong>Données de commandes :</strong> informations client, adresse de livraison, montants.</li>
            <li><strong>Données de paiement :</strong> montant, devise, statut de transaction (nous ne stockons pas les numéros de carte).</li>
            <li><strong>Données WhatsApp :</strong> numéros de téléphone des clients, messages échangés via le bot SIRA dans le cadre du traitement des commandes.</li>
            <li><strong>Données d'utilisation :</strong> journaux d'accès, statistiques de ventes, actions sur la plateforme.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Utilisation des données</h2>
          <p className="mb-3">Vos données sont utilisées pour :</p>
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li>Fournir et améliorer le service AfriSell.</li>
            <li>Traiter les paiements et gérer les abonnements.</li>
            <li>Faire fonctionner le bot WhatsApp SIRA (prise de commande, réponses automatiques, localisation).</li>
            <li>Envoyer des notifications transactionnelles (confirmation de commande, renouvellement d'abonnement).</li>
            <li>Générer des statistiques anonymisées sur l'utilisation de la plateforme.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Intégration WhatsApp / Meta</h2>
          <p className="mb-3">
            AfriSell s'intègre à la <strong>Meta Business Platform (WhatsApp Business API)</strong> pour permettre
            aux vendeurs de recevoir et traiter des commandes via WhatsApp.
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li>Les messages WhatsApp sont traités conformément aux <a href="https://www.whatsapp.com/legal/business-policy" className="text-green-600 underline" target="_blank" rel="noreferrer">Règles de la Plateforme WhatsApp Business</a>.</li>
            <li>Nous ne lisons pas les conversations personnelles — seuls les messages adressés au numéro WhatsApp Business du vendeur sont traités.</li>
            <li>Les données de messages ne sont pas partagées avec des tiers et sont conservées uniquement pour le traitement des commandes.</li>
            <li>Les utilisateurs finaux (clients du vendeur) peuvent demander la suppression de leurs données en contactant directement le vendeur.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Partage des données</h2>
          <p className="mb-3">Nous ne vendons pas vos données. Nous pouvons les partager avec :</p>
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li><strong>Processeurs de paiement</strong> (Paystack, Stripe, CinetPay) pour traiter les transactions.</li>
            <li><strong>Meta / WhatsApp</strong> pour la transmission des messages via leur API.</li>
            <li><strong>Fournisseurs d'infrastructure</strong> (Railway, Neon, Cloudinary) pour l'hébergement et le stockage.</li>
            <li>Autorités légales si requis par la loi.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Conservation des données</h2>
          <p>
            Les données de compte sont conservées tant que votre compte est actif.
            Les messages WhatsApp traités par SIRA sont conservés pendant <strong>12 mois</strong> maximum,
            puis supprimés automatiquement. Vous pouvez demander la suppression de vos données à tout moment.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Sécurité</h2>
          <p>
            Toutes les communications sont chiffrées via HTTPS/TLS. Les mots de passe sont hashés (bcrypt).
            Les clés API et secrets sont stockés dans des variables d'environnement sécurisées et jamais exposés côté client.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Vos droits</h2>
          <p className="mb-3">Vous avez le droit de :</p>
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li>Accéder à vos données personnelles.</li>
            <li>Corriger des données inexactes.</li>
            <li>Demander la suppression de votre compte et de vos données.</li>
            <li>Vous opposer au traitement de vos données.</li>
          </ul>
          <p className="mt-3">
            Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@afrisell.com" className="text-green-600 underline">privacy@afrisell.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Cookies</h2>
          <p>
            AfriSell utilise uniquement des cookies techniques strictement nécessaires au fonctionnement du service
            (session d'authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Modifications</h2>
          <p>
            Nous pouvons mettre à jour cette politique. En cas de modification substantielle, nous vous en informerons
            par e-mail ou via une notification dans l'application.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact</h2>
          <p>
            Pour toute question relative à cette politique :<br />
            <strong>AfriSell</strong><br />
            E-mail : <a href="mailto:privacy@afrisell.com" className="text-green-600 underline">privacy@afrisell.com</a>
          </p>
        </section>

      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 py-8 px-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} AfriSell — Tous droits réservés
      </div>
    </div>
  )
}
