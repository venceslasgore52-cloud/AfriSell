import { useState, useEffect } from 'react';
import { User, Phone, Mail, Lock, Eye, EyeOff, Save, CheckCircle2, Store, Bell,
         Link2, Link2Off, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { authService } from '../../services/auth';
import { socialConnectionService } from '../../services/socialConnectionService';

const INPUT_CLS = 'w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition';

const PLATFORMS = {
  facebook:  { label: 'Facebook',          color: 'bg-[#1877F2]', desc: 'Publiez vos produits sur votre Page Facebook automatiquement.' },
  instagram: { label: 'Instagram',         color: 'bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', desc: 'Partagez vos produits sur Instagram Business.' },
  whatsapp:  { label: 'WhatsApp Business', color: 'bg-[#25D366]', desc: 'Activez le bot WhatsApp pour recevoir et répondre aux clients.' },
  tiktok:    { label: 'TikTok',            color: 'bg-[#010101]', desc: 'Publiez des vidéos produits sur TikTok.' },
};

function PlatformIcon({ platform, size = 20 }) {
  const icons = {
    facebook:  <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    instagram: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
    whatsapp:  <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
    tiktok:    <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.95a8.16 8.16 0 004.77 1.52V7.02a4.85 4.85 0 01-1-.33z"/></svg>,
  };
  return icons[platform] || null;
}

function SettingField({ label, icon: Icon, ...props }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
        <input
          {...props}
          className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition`}
        />
      </div>
    </div>
  );
}

function SaveBtn({ saving, saved, section, onClick }) {
  return (
    <button
      type="submit"
      disabled={saving === section}
      onClick={section !== 'password' ? onClick : undefined}
      className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-60"
    >
      {saved === section ? (
        <><CheckCircle2 size={15} /> Enregistré</>
      ) : (
        <><Save size={15} /> {saving === section ? 'Enregistrement…' : 'Enregistrer'}</>
      )}
    </button>
  );
}

export default function Setting() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [shop, setShop] = useState({
    name:            '',
    whatsapp_number: '',
    description:     '',
  });

  const [pwd, setPwd]       = useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving]   = useState('');
  const [saved, setSaved]     = useState('');
  const [error, setError]     = useState('');

  const [connections, setConnections]             = useState({});
  const [connectingPlatform, setConnectingPlatform] = useState('');
  const [connectMsg, setConnectMsg]               = useState({ type: '', text: '' });

  useEffect(() => {
    socialConnectionService.getStatus()
      .then(setConnections)
      .catch(() => {});
    authService.getShop()
      .then((data) => setShop({
        name:            data.name            || '',
        whatsapp_number: data.whatsapp_number || '',
        description:     data.description     || '',
      }))
      .catch(() => {});
  }, []);

  const handleConnect = async (platform) => {
    setConnectingPlatform(platform);
    setConnectMsg({ type: '', text: '' });
    try {
      await socialConnectionService.connect(platform);
      setConnectMsg({ type: 'success', text: `${PLATFORMS[platform].label} connecté avec succès !` });
      const data = await socialConnectionService.getStatus();
      setConnections(data);
    } catch (err) {
      setConnectMsg({ type: 'error', text: err.message });
    } finally {
      setConnectingPlatform('');
    }
  };

  const handleDisconnect = async (platform) => {
    if (!window.confirm(`Déconnecter ${PLATFORMS[platform].label} ?`)) return;
    try {
      await socialConnectionService.disconnect(platform);
      const data = await socialConnectionService.getStatus();
      setConnections(data);
      setConnectMsg({ type: 'success', text: `${PLATFORMS[platform].label} déconnecté.` });
    } catch (err) {
      setConnectMsg({ type: 'error', text: err.message });
    }
  };

  const formatPhone = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    if (!trimmed.startsWith('+')) return '+' + trimmed;
    return trimmed;
  };

  const handleSave = async (section, data) => {
    setSaving(section);
    setError('');
    try {
      if (section === 'profile') {
        const updated = await authService.updateProfile(data);
        updateUser(updated);
      } else if (section === 'shop') {
        await authService.updateShop(data);
      }
      setSaved(section);
      setTimeout(() => setSaved(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving('');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (pwd.next.length < 8) { setError('Minimum 8 caractères requis.'); return; }
    setSaving('password');
    setError('');
    try {
      await authService.changePassword(pwd.current, pwd.next);
      setPwd({ current: '', next: '', confirm: '' });
      setSaved('password');
      setTimeout(() => setSaved(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8 pt-2 md:pt-0">
        <h1 className="text-2xl font-black text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez votre profil et votre boutique</p>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm max-w-2xl">
          {error}
        </div>
      )}

      <div className="space-y-6 max-w-2xl">

        {/* Profil */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
              <User size={16} className="text-green-600" />
            </div>
            <h2 className="font-bold text-gray-900">Profil personnel</h2>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center text-2xl font-black">
              {profile.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{profile.name || 'Utilisateur'}</p>
              <p className="text-xs text-gray-400">{profile.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <SettingField label="Nom complet" icon={User} value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <SettingField label="Adresse email" icon={Mail} type="email" value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            <SettingField label="Téléphone" icon={Phone} type="tel" value={profile.phone}
              placeholder="+225 07 00 00 00 00"
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>

          <div className="mt-5 flex justify-end">
            <SaveBtn saving={saving} saved={saved} section="profile"
              onClick={() => handleSave('profile', profile)} />
          </div>
        </div>

        {/* Boutique */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <Store size={16} className="text-blue-600" />
            </div>
            <h2 className="font-bold text-gray-900">Ma boutique</h2>
          </div>

          <div className="space-y-4">
            <SettingField label="Nom de la boutique" icon={Store} value={shop.name}
              placeholder="Ma boutique mode"
              onChange={(e) => setShop({ ...shop, name: e.target.value })} />
            <SettingField label="Numéro WhatsApp pro" icon={Phone} type="tel" value={shop.whatsapp_number}
              placeholder="+225 07 00 00 00 00"
              onChange={(e) => setShop({ ...shop, whatsapp_number: e.target.value })}
              onBlur={(e) => setShop({ ...shop, whatsapp_number: formatPhone(e.target.value) })} />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description de la boutique
              </label>
              <textarea
                rows={3}
                value={shop.description}
                onChange={(e) => setShop({ ...shop, description: e.target.value })}
                placeholder="Décrivez votre boutique en quelques mots…"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition resize-none"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <SaveBtn saving={saving} saved={saved} section="shop"
              onClick={() => handleSave('shop', shop)} />
          </div>
        </div>

        {/* Sécurité */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <Lock size={16} className="text-red-500" />
            </div>
            <h2 className="font-bold text-gray-900">Sécurité</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mot de passe actuel
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPwd ? 'text' : 'password'} required value={pwd.current}
                  onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <SettingField label="Nouveau mot de passe" icon={Lock} type="password"
              value={pwd.next} placeholder="Minimum 8 caractères"
              onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
            <SettingField label="Confirmer le nouveau mot de passe" icon={Lock} type="password"
              value={pwd.confirm} placeholder="••••••••"
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />

            <div className="flex justify-end mt-2">
              <SaveBtn saving={saving} saved={saved} section="password" />
            </div>
          </form>
        </div>

        {/* Réseaux sociaux */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Link2 size={16} className="text-indigo-600" />
            </div>
            <h2 className="font-bold text-gray-900">Connexions réseaux sociaux</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5 ml-11">
            Autorisez AfriSell à publier et à gérer votre bot sur vos plateformes.
          </p>

          {connectMsg.text && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-sm mb-4 ${
              connectMsg.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {connectMsg.type === 'success'
                ? <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />
                : <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />}
              {connectMsg.text}
            </div>
          )}

          <div className="space-y-3">
            {Object.entries(PLATFORMS).map(([key, plat]) => {
              const conn = connections[key] || {};
              const isConnected  = conn.connected === true;
              const isConnecting = connectingPlatform === key;

              return (
                <div key={key} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isConnected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${plat.color}`}>
                    <PlatformIcon platform={key} size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{plat.label}</p>
                      {isConnected && (
                        <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                          Connecté
                        </span>
                      )}
                    </div>
                    {isConnected && conn.account_name ? (
                      <p className="text-xs text-green-600 truncate mt-0.5">@{conn.account_name}</p>
                    ) : (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{plat.desc}</p>
                    )}
                  </div>

                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(key)}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition flex-shrink-0"
                    >
                      <Link2Off size={13} /> Déconnecter
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(key)}
                      disabled={isConnecting}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 px-3 py-2 rounded-lg transition flex-shrink-0"
                    >
                      {isConnecting ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                      {isConnecting ? 'Connexion…' : 'Autoriser'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
            Un popup s'ouvrira pour vous rediriger vers la plateforme. Aucun mot de passe ne vous sera demandé ici.
            Vos autorisations sont révocables à tout moment.
          </p>
        </div>

        {/* Abonnement */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
              <Bell size={16} className="text-purple-600" />
            </div>
            <h2 className="font-bold text-gray-900">Abonnement</h2>
          </div>
          <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl p-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Plan {user?.plan || 'Gratuit'}</p>
              <p className="text-xs text-gray-500 mt-0.5">Gérez votre abonnement depuis la page Facturation</p>
            </div>
            <a href="/billing" className="bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-green-700 transition">
              Changer de plan
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
