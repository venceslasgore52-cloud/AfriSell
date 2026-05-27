export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center font-black text-white text-lg">A</div>
            <span className="font-bold text-xl">AfriSell</span>
          </div>
          <h1 className="text-3xl font-black">Conditions Générales d'Utilisation</h1>
          <p className="text-gray-400 mt-2 text-sm">Dernière mise à jour : mai 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptation des conditions</h2>
          <p>
            En accédant à AfriSell et en utilisant nos services, vous acceptez d'être lié par les présentes
            Conditions Générales d'Utilisation (« CGU »). Si vous n'acceptez pas ces conditions, vous ne devez
            pas utiliser notre plateforme.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description du service</h2>
          <p className="mb-3">
            AfriSell est une plateforme SaaS de commerce en ligne destinée aux vendeurs africains. Elle offre :
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li>Un catalogue de produits en ligne.</li>
            <li>Un système de gestion de commandes.</li>
            <li>Un bot WhatsApp intelligent (SIRA) pour automatiser les ventes.</li>
            <li>Un Studio IA pour créer du contenu marketing (flyers, textes, vidéos).</li>
            <li>Des statistiques de ventes et analyses de marché.</li>
            <li>Des outils de publication sur les réseaux sociaux.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Inscription et compte</h2>
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li>Vous devez avoir au moins 18 ans pour créer un compte.</li>
            <li>Vous êtes responsable de la confidentialité de vos identifiants de connexion.</li>
            <li>Vous vous engagez à fournir des informations exactes et à les maintenir à jour.</li>
            <li>Un seul compte par personne ou entité commerciale est autorisé.</li>
            <li>AfriSell se réserve le droit de suspendre ou supprimer tout compte ne respectant pas ces CGU.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Abonnements et paiements</h2>
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li>Les abonnements sont disponibles en formule mensuelle ou annuelle selon le plan choisi.</li>
            <li>Les paiements sont traités via des prestataires tiers sécurisés (Paystack, Stripe, CinetPay).</li>
            <li>Les abonnements sont renouvelés automatiquement sauf annulation avant la date d'échéance.</li>
            <li>Aucun remboursement n'est effectué pour la période en cours, sauf disposition légale contraire.</li>
            <li>Les prix peuvent être modifiés avec un préavis de 30 jours.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Utilisation acceptable</h2>
          <p className="mb-3">Il est interdit d'utiliser AfriSell pour :</p>
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li>Vendre des produits illégaux, contrefaits ou dangereux.</li>
            <li>Diffuser du contenu frauduleux, trompeur ou à caractère haineux.</li>
            <li>Spammer des clients via le bot WhatsApp.</li>
            <li>Contourner les mesures de sécurité de la plateforme.</li>
            <li>Collecter des données personnelles sans le consentement des utilisateurs.</li>
            <li>Toute activité violant les lois en vigueur dans votre pays.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Intégration WhatsApp / Meta</h2>
          <p className="mb-3">
            L'utilisation du bot SIRA via la Meta Business Platform est soumise aux conditions de Meta :
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li>Vous devez respecter les <a href="https://www.whatsapp.com/legal/business-policy" className="text-green-600 underline" target="_blank" rel="noreferrer">Règles WhatsApp Business</a> et les <a href="https://developers.facebook.com/terms/" className="text-green-600 underline" target="_blank" rel="noreferrer">Conditions d'utilisation de Meta</a>.</li>
            <li>Vous ne pouvez envoyer des messages qu'aux clients ayant consenti à être contactés.</li>
            <li>Tout usage abusif (spam, contenu interdit) peut entraîner la suspension de votre accès WhatsApp.</li>
            <li>AfriSell n'est pas responsable des décisions de Meta concernant votre compte WhatsApp Business.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Propriété intellectuelle</h2>
          <p>
            AfriSell et son logo sont la propriété exclusive de leurs créateurs. Le contenu que vous publiez
            sur la plateforme (produits, images, descriptions) reste votre propriété. Vous accordez à AfriSell
            une licence limitée pour afficher et traiter ce contenu dans le cadre du service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Limitation de responsabilité</h2>
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li>AfriSell est fourni « en l'état », sans garantie d'absence d'interruption ou d'erreur.</li>
            <li>Nous ne sommes pas responsables des pertes commerciales résultant d'une indisponibilité du service.</li>
            <li>Nous ne sommes pas responsables des transactions entre vendeurs et leurs clients.</li>
            <li>Notre responsabilité totale ne peut excéder le montant payé pour votre abonnement au cours des 3 derniers mois.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Résiliation</h2>
          <p>
            Vous pouvez résilier votre compte à tout moment depuis les paramètres de votre tableau de bord.
            AfriSell peut résilier ou suspendre votre accès en cas de violation des présentes CGU, sans préavis
            ni remboursement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Modifications des CGU</h2>
          <p>
            Nous pouvons modifier ces conditions à tout moment. Les modifications entrent en vigueur 30 jours
            après notification. L'utilisation continue du service vaut acceptation des nouvelles conditions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">11. Droit applicable</h2>
          <p>
            Les présentes CGU sont régies par le droit applicable dans le pays de résidence de l'opérateur
            d'AfriSell. Tout litige sera soumis à la juridiction compétente correspondante.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">12. Contact</h2>
          <p>
            Pour toute question relative aux présentes CGU :<br />
            <strong>AfriSell</strong><br />
            E-mail : <a href="mailto:legal@afrisell.com" className="text-green-600 underline">legal@afrisell.com</a>
          </p>
        </section>

      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 py-8 px-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} AfriSell — Tous droits réservés ·{' '}
        <a href="/privacy-policy" className="underline hover:text-gray-600">Politique de confidentialité</a>
      </div>
    </div>
  )
}
