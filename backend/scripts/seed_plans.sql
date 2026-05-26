-- ============================================================
--  AfriSell — Seed des 3 plans d'abonnement
--  À coller dans le SQL Editor de Neon
--  Table cible : billing_plan
-- ============================================================

-- Supprimer les plans existants si besoin (optionnel)
-- DELETE FROM billing_plan;

INSERT INTO billing_plan (
    id,
    name, slug, interval,
    price_africa, price_global, currency,

    -- Limites Studio IA
    max_flyers_ai, max_video_ai, max_text_ai, max_ai_requests,

    -- Limites Catalogue / Commandes
    max_products, max_orders,

    -- SIRA Bot
    has_sira_bot, sira_auto_reply, sira_order_capture, sira_location_fetch,

    -- Studio IA
    has_studio, has_bg_removal, has_auto_publish, has_smart_schedule,

    -- Analytics
    has_analytics, has_market_analysis,

    -- Notifications
    has_whatsapp_notif,

    -- IDs paiement (vides pour l'instant)
    stripe_price_id, stripe_product_id, geniuspay_plan_id, cinetpay_plan_id,

    -- Statut
    is_active, is_popular, created_at
)
VALUES

-- ── STARTER — 5$ Afrique / 10$ Global ────────────────────────────────────────
(
    gen_random_uuid(),
    'Starter', 'starter', 'monthly',
    5.00, 10.00, 'USD',

    10, 0, 20, 50,

    10, 50,

    false, false, false, false,

    true, false, false, false,

    false, false,

    true,

    '', '', '', '',

    true, false, NOW()
),

-- ── PRO — 20$ Afrique / 20$ Global ───────────────────────────────────────────
(
    gen_random_uuid(),
    'Pro', 'pro', 'monthly',
    20.00, 20.00, 'USD',

    NULL, 10, NULL, NULL,

    50, NULL,

    true, true, true, true,

    true, true, false, false,

    true, true,

    true,

    '', '', '', '',

    true, true, NOW()
),

-- ── BUSINESS — 30$ Afrique / 30$ Global ──────────────────────────────────────
(
    gen_random_uuid(),
    'Business', 'business', 'monthly',
    30.00, 30.00, 'USD',

    NULL, NULL, NULL, NULL,

    NULL, NULL,

    true, true, true, true,

    true, true, true, true,

    true, true,

    true,

    '', '', '', '',

    true, false, NOW()
);

-- Vérification
SELECT name, slug, price_africa, price_global, max_products, has_sira_bot, has_analytics, is_popular
FROM billing_plan
ORDER BY price_global;
