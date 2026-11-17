// Buyer <-> shop messaging. `as` = 'buyer' (personal inbox) or 'shop' (seller inbox).
const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

router.use(requireAuth);

const DEMO_REPLIES = [
  'Hello po! Salamat sa message. Available pa po ito — pwede na i-checkout anytime.',
  'Hi! Yes po, original item ito. Naka-bubble wrap at kahon pag pinadala.',
  'Thank you for your interest! Ships within 1–2 days after payment po.',
  'Pwede po ako mag-send ng more photos kung gusto niyo. Ingat po!',
  'Good day po! Last piece na lang po ito. Salamat sa pag-suporta sa maliit na tindahan!',
];

function side(req) {
  if (req.query.as === 'shop' || req.body?.as === 'shop') {
    if (!req.shop) return null;
    return 'shop';
  }
  return 'buyer';
}

// Ensure the user is a participant of this conversation, in the role they claim.
async function loadConversation(req, id) {
  const as = side(req);
  if (!as) return {};
  const [[c]] = await db.query('SELECT * FROM conversations WHERE id = ?', [id]);
  if (!c) return {};
  if (as === 'buyer' && c.buyer_id !== req.user.id) return {};
  if (as === 'shop' && c.shop_id !== req.shop.id) return {};
  return { c, as };
}

router.get('/unread', async (req, res) => {
  const [[b]] = await db.query(`SELECT COUNT(*) n FROM messages m JOIN conversations c ON c.id = m.conversation_id
    WHERE c.buyer_id = ? AND m.sender = 'shop' AND m.is_read = 0`, [req.user.id]);
  let shop = 0;
  if (req.shop) {
    const [[s]] = await db.query(`SELECT COUNT(*) n FROM messages m JOIN conversations c ON c.id = m.conversation_id
      WHERE c.shop_id = ? AND m.sender = 'buyer' AND m.is_read = 0`, [req.shop.id]);
    shop = s.n;
  }
  res.json({ buyer: b.n, shop });
});

router.get('/conversations', async (req, res) => {
  const as = side(req);
  if (!as) return res.status(403).json({ error: 'No shop.' });
  const other = as === 'buyer' ? 'shop' : 'buyer';
  const [rows] = await db.query(`
    SELECT c.*, s.name AS shop_name, s.slug AS shop_slug, s.color AS shop_color, s.logo_url AS shop_logo,
      u.name AS buyer_name, u.avatar_url AS buyer_avatar,
      p.name AS product_name,
      (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_message,
      (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender = ? AND is_read = 0) AS unread
    FROM conversations c
    JOIN shops s ON s.id = c.shop_id JOIN users u ON u.id = c.buyer_id
    LEFT JOIN products p ON p.id = c.product_id
    WHERE ${as === 'buyer' ? 'c.buyer_id = ?' : 'c.shop_id = ?'}
    ORDER BY c.updated_at DESC, c.id DESC`, [other, as === 'buyer' ? req.user.id : req.shop.id]);
  res.json(rows);
});

// Start (or reopen) a chat with a shop, optionally about a product.
router.post('/conversations', async (req, res) => {
  const shopId = Number(req.body.shopId);
  const productId = req.body.productId ? Number(req.body.productId) : null;
  if (req.shop && req.shop.id === shopId) return res.status(400).json({ error: "That's your own shop." });
  const [[shop]] = await db.query('SELECT id FROM shops WHERE id = ?', [shopId]);
  if (!shop) return res.status(404).json({ error: 'Shop not found.' });
  await db.query(`INSERT INTO conversations (buyer_id, shop_id, product_id) VALUES (?,?,?)
    ON DUPLICATE KEY UPDATE product_id = COALESCE(VALUES(product_id), product_id), updated_at = NOW()`,
    [req.user.id, shopId, productId]);
  const [[c]] = await db.query('SELECT id FROM conversations WHERE buyer_id = ? AND shop_id = ?', [req.user.id, shopId]);
  res.json({ id: c.id });
});

router.get('/conversations/:id/messages', async (req, res) => {
  const { c, as } = await loadConversation(req, req.params.id);
  if (!c) return res.status(404).json({ error: 'Conversation not found.' });
  const other = as === 'buyer' ? 'shop' : 'buyer';
  await db.query('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender = ?', [c.id, other]);
  const [msgs] = await db.query(`
    SELECT m.*, p.name AS product_name, p.price AS product_price, p.art_color, c2.slug AS category_slug, p.image_url
    FROM messages m LEFT JOIN products p ON p.id = m.product_id
    LEFT JOIN categories c2 ON c2.id = p.category_id
    WHERE m.conversation_id = ? ORDER BY m.id`, [c.id]);
  const [[meta]] = await db.query(`
    SELECT s.id AS shop_id, s.name AS shop_name, s.slug AS shop_slug, s.color AS shop_color, s.is_demo,
           s.logo_url AS shop_logo, u.name AS buyer_name, u.avatar_url AS buyer_avatar
    FROM conversations c JOIN shops s ON s.id = c.shop_id JOIN users u ON u.id = c.buyer_id WHERE c.id = ?`, [c.id]);
  res.json({ conversation: { ...c, ...meta }, messages: msgs });
});

router.post('/conversations/:id/messages', async (req, res) => {
  const { c, as } = await loadConversation(req, req.params.id);
  if (!c) return res.status(404).json({ error: 'Conversation not found.' });
  const body = (req.body.body || '').trim();
  const productId = req.body.productId || null;
  if (!body && !productId) return res.status(400).json({ error: 'Message is empty.' });
  await db.query('INSERT INTO messages (conversation_id, sender, body, product_id) VALUES (?,?,?,?)',
    [c.id, as, body, productId]);
  await db.query('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [c.id]);

  // Demo shops are unattended — send a friendly auto-reply a moment later.
  if (as === 'buyer') {
    const [[s]] = await db.query('SELECT is_demo FROM shops WHERE id = ?', [c.shop_id]);
    if (s.is_demo) {
      setTimeout(() => {
        const reply = DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
        db.query('INSERT INTO messages (conversation_id, sender, body) VALUES (?,?,?)', [c.id, 'shop', reply])
          .then(() => db.query('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [c.id]))
          .catch(() => {});
      }, 2500);
    }
  }
  res.json({ ok: true });
});

module.exports = router;
