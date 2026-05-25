/**
 * AfriSell WA-Bridge
 * Connecte les numéros WhatsApp via QR code et relaie les messages à Django SIRA.
 * Remplacé par l'API officielle Meta en production.
 */

require('dotenv').config();
const express    = require('express');
const qrcode     = require('qrcode');
const axios      = require('axios');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app     = express();
const PORT    = process.env.PORT || 3000;
const DJANGO  = process.env.DJANGO_WEBHOOK_URL;
const SECRET  = process.env.BRIDGE_SECRET;

app.use(express.json());

// ── Sessions par boutique ─────────────────────────────────────────────────────
// Map shopId → { client, qrData, status }
const sessions = new Map();

// ── Routes ────────────────────────────────────────────────────────────────────

// Santé du service
app.get('/health', (req, res) => {
  const state = {};
  sessions.forEach((s, id) => { state[id] = s.status; });
  res.json({ ok: true, sessions: state });
});

// Démarrer une session et obtenir le QR code
app.post('/session/start', async (req, res) => {
  const { shop_id } = req.body;
  if (!shop_id) return res.status(400).json({ error: 'shop_id requis' });

  if (sessions.has(shop_id)) {
    const s = sessions.get(shop_id);
    if (s.status === 'ready') return res.json({ status: 'already_connected' });
    if (s.status === 'qr_pending' && s.qrData) {
      const qrImage = await qrcode.toDataURL(s.qrData);
      return res.json({ status: 'qr_pending', qr: qrImage });
    }
    // initializing ou qr_pending sans QR encore — on attend sans redémarrer
    const qrImage = await _waitForQR(shop_id, 15000);
    if (qrImage) return res.json({ status: 'qr_pending', qr: qrImage });
    return res.status(504).json({ error: 'QR non disponible, réessaie.' });
  }

  _startSession(shop_id);
  // on attend le premier QR (max 15s)
  const qrImage = await _waitForQR(shop_id, 15000);
  if (!qrImage) return res.status(504).json({ error: 'QR non disponible, réessaie.' });
  res.json({ status: 'qr_pending', qr: qrImage });
});

// État d'une session
app.get('/session/:shop_id/status', (req, res) => {
  const s = sessions.get(req.params.shop_id);
  if (!s) return res.json({ status: 'not_started' });
  res.json({ status: s.status, phone: s.phone || null });
});

// Déconnecter une session
app.post('/session/:shop_id/logout', async (req, res) => {
  const s = sessions.get(req.params.shop_id);
  if (!s) return res.json({ ok: true });
  try { await s.client.logout(); } catch (_) {}
  sessions.delete(req.params.shop_id);
  res.json({ ok: true });
});

// Envoyer un message WhatsApp (appelé par Django)
app.post('/send', async (req, res) => {
  const { shop_id, to, body } = req.body;
  if (!shop_id || !to || !body)
    return res.status(400).json({ error: 'shop_id, to et body requis' });

  const s = sessions.get(shop_id);
  if (!s || s.status !== 'ready')
    return res.status(503).json({ error: `Session ${shop_id} non connectée` });

  try {
    // WhatsApp attend le format "22500000000@c.us"
    // si to contient déjà '@' (ex: @lid ou @c.us) on l'utilise directement
    const clean  = to.replace('whatsapp:', '').replace(/^\+/, '');
    const chatId = clean.includes('@') ? clean : clean + '@c.us';
    await s.client.sendMessage(chatId, body);
    res.json({ ok: true });
  } catch (err) {
    console.error(`[${shop_id}] Erreur envoi:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Logique de session ─────────────────────────────────────────────────────────

function _startSession(shopId) {
  console.log(`[${shopId}] Démarrage session WhatsApp...`);

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: shopId, dataPath: './sessions' }),
    puppeteer: {
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
  });

  const session = { client, qrData: null, status: 'initializing', phone: null };
  sessions.set(shopId, session);

  client.on('qr', (qr) => {
    console.log(`[${shopId}] QR reçu — scanne avec WhatsApp`);
    session.qrData  = qr;
    session.status  = 'qr_pending';
  });

  client.on('ready', async () => {
    session.status = 'ready';
    session.phone  = client.info?.wid?.user || null;
    console.log(`[${shopId}] ✅ Connecté — numéro: ${session.phone}`);
    // notifie Django que la session est prête
    _notifyDjango({ event: 'session_ready', shop_id: shopId, phone: session.phone });
  });

  client.on('disconnected', (reason) => {
    console.log(`[${shopId}] Déconnecté: ${reason}`);
    session.status = 'disconnected';
  });

  client.on('message', async (msg) => {
    if (msg.fromMe) return;
    console.log(`[${shopId}] Message reçu de ${msg.from}: ${msg.body}`);

    let latitude = null, longitude = null;
    if (msg.type === 'location') {
      latitude  = msg.location?.latitude;
      longitude = msg.location?.longitude;
    }

    // résoudre le vrai numéro même pour les IDs @lid
    let phoneNumber = msg.from;
    try {
      const contact = await msg.getContact();
      if (contact.number) phoneNumber = contact.number + '@c.us';
    } catch (_) {}

    _notifyDjango({
      event      : 'message',
      shop_id    : shopId,
      from       : phoneNumber,
      wa_id      : msg.from,        // ID original pour l'envoi (peut être @lid)
      to         : client.info?.wid?.user || shopId,
      body       : msg.body || '',
      type       : msg.type,
      latitude,
      longitude,
      media_url  : '',
      media_type : '',
    });
  });

  client.initialize();
}

async function _waitForQR(shopId, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const s = sessions.get(shopId);
    if (s?.qrData) return await qrcode.toDataURL(s.qrData);
    await new Promise(r => setTimeout(r, 500));
  }
  return null;
}

async function _notifyDjango(payload) {
  try {
    await axios.post(DJANGO, payload, {
      headers: { 'X-Bridge-Secret': SECRET },
      timeout: 10000,
    });
  } catch (err) {
    console.error('Erreur Django webhook:', err.message);
  }
}

// ── Démarrage ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`WA-Bridge AfriSell démarré sur http://localhost:${PORT}`);
  console.log(`Django webhook → ${DJANGO}`);
});
