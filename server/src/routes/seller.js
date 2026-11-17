// Seller platform: the shop "page" bound to a personal account.
const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireShop } = require('../auth');
const { FLOW, setStatus } = require('../orders');
const { loadOrders } = require('./shopping');
const { saveUploads, setProductImages, attachImages, MAX_IMAGES, cleanPhoto } = require('../images');

router.use(requireAuth);

const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'shop';

// Apply as seller — approved instantly (no admin on this platform).
router.post('/apply', async (req, res) => {
  if (req.shop) return res.status(400).json({ error: 'You already have a shop.' });
  const { name, tagline, description, location, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Shop name is required.' });
  if (!req.body.agree) return res.status(400).json({ error: 'Please agree to the seller guidelines.' });
  let slug = slugify(name);
  const [[taken]] = await db.query('SELECT id FROM shops WHERE slug = ?', [slug]);
  if (taken) slug += '-' + Math.random().toString(36).slice(2, 6);
  await db.query(`INSERT INTO shops (user_id, name, slug, tagline, description, location, color)
                  VALUES (?,?,?,?,?,?,?)`,
    [req.user.id, name.trim(), slug, tagline || null, description || null, location || null, color || '#D9412B']);
  const [[shop]] = await db.query('SELECT * FROM shops WHERE user_id = ?', [req.user.id]);
  await db.query('DELETE FROM cart_items WHERE user_id = ? AND product_id IN (SELECT id FROM products WHERE shop_id = ?)', [req.user.id, shop.id]);
  res.json({ shop });
});

router.use(requireShop);

router.get('/shop', (req, res) => res.json(req.shop));

// Update only the shop fields that were sent (also logo_url / cover_url)
router.put('/shop', async (req, res) => {
  const b = req.body, set = {};
  if ('name' in b) {
    if (!b.name?.trim()) return res.status(400).json({ error: 'Shop name is required.' });
    set.name = b.name.trim().slice(0, 100);
  }
  for (const k of ['tagline', 'description', 'location']) if (k in b) set[k] = b[k]?.trim() || null;
  if ('color' in b) set.color = /^#[0-9a-fA-F]{6}$/.test(b.color || '') ? b.color : '#D9412B';
  for (const k of ['logo_url', 'cover_url']) {
    if (k in b) {
      const v = cleanPhoto(b[k]);
      if (v === undefined) return res.status(400).json({ error: 'That photo link is not allowed.' });
      set[k] = v;
    }
  }
  const keys = Object.keys(set);
  if (keys.length) await db.query(`UPDATE shops SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`, [...keys.map(k => set[k]), req.shop.id]);
  const [[shop]] = await db.query('SELECT * FROM shops WHERE id = ?', [req.shop.id]);
  res.json(shop);
});

router.get('/stats', async (req, res) => {
  const id = req.shop.id;
  const [[sales]] = await db.query(`
    SELECT COALESCE(SUM(CASE WHEN status <> 'Cancelled' THEN subtotal END),0) AS revenue,
           COUNT(CASE WHEN status <> 'Cancelled' THEN 1 END) AS orders,
           COUNT(CASE WHEN status IN ('Placed','Packed') THEN 1 END) AS to_ship
    FROM orders WHERE shop_id = ?`, [id]);
  const [[prod]] = await db.query(`
    SELECT COUNT(*) AS listings, COALESCE(SUM(stock = 0),0) AS sold_out
    FROM products WHERE shop_id = ? AND is_active = 1`, [id]);
  const [[chat]] = await db.query(`
    SELECT COUNT(*) AS unread FROM messages m JOIN conversations c ON c.id = m.conversation_id
    WHERE c.shop_id = ? AND m.sender = 'buyer' AND m.is_read = 0`, [id]);
  res.json({ ...sales, ...prod, unread: chat.unread });
});

// ---------- Photo uploads ----------
router.post('/uploads', async (req, res) => {
  try { res.json({ urls: saveUploads(req.body.images) }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ---------- Listings ----------
router.get('/products', async (req, res) => {
  const [rows] = await db.query(`
    SELECT p.*, c.slug AS category_slug, c.name AS category_name,
      (SELECT COALESCE(SUM(oi.qty),0) FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = p.id AND o.status <> 'Cancelled') AS sold
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.shop_id = ? AND p.is_active = 1 ORDER BY p.created_at DESC, p.id DESC`, [req.shop.id]);
  res.json(await attachImages(rows));
});

function validate(b) {
  if (!b.name?.trim()) return 'Item name is required.';
  if (!(Number(b.price) > 0)) return 'Enter a price greater than ₱0.';
  if (!b.category_id) return 'Pick a category.';
  if (!(Number(b.stock) >= 0)) return 'Stock must be 0 or more.';
  if (Array.isArray(b.images) && b.images.length > MAX_IMAGES) return `You can add up to ${MAX_IMAGES} photos.`;
  return null;
}
const fields = b => [b.category_id, b.name.trim(), Number(b.price), b.description || '',
  b.condition_grade || 'Good', b.era || null, Number(b.stock), (Array.isArray(b.images) ? b.images[0] : b.image_url) || null, b.art_color || '#D9412B'];

router.post('/products', async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const [r] = await db.query(`INSERT INTO products
    (shop_id, category_id, name, price, description, condition_grade, era, stock, image_url, art_color)
    VALUES (?,?,?,?,?,?,?,?,?,?)`, [req.shop.id, ...fields(req.body)]);
  if (Array.isArray(req.body.images)) await setProductImages(r.insertId, req.body.images);
  res.json({ id: r.insertId });
});

router.put('/products/:id', async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const [r] = await db.query(`UPDATE products SET category_id=?, name=?, price=?, description=?,
    condition_grade=?, era=?, stock=?, image_url=?, art_color=? WHERE id=? AND shop_id=?`,
    [...fields(req.body), req.params.id, req.shop.id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Listing not found.' });
  if (Array.isArray(req.body.images)) await setProductImages(req.params.id, req.body.images);
  res.json({ ok: true });
});

// Soft delete so past orders keep their history.
router.delete('/products/:id', async (req, res) => {
  await db.query('UPDATE products SET is_active = 0 WHERE id = ? AND shop_id = ?', [req.params.id, req.shop.id]);
  await db.query('DELETE FROM cart_items WHERE product_id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- Orders received ----------
router.get('/orders', async (req, res) => {
  res.json(await loadOrders('o.shop_id = ?', [req.shop.id]));
});

router.post('/orders/:id/advance', async (req, res) => {
  const [[o]] = await db.query('SELECT * FROM orders WHERE id = ? AND shop_id = ?', [req.params.id, req.shop.id]);
  if (!o) return res.status(404).json({ error: 'Order not found.' });
  const idx = FLOW.indexOf(o.status);
  if (idx < 0 || idx === FLOW.length - 1) return res.status(400).json({ error: 'This order can no longer be updated.' });
  await setStatus(db, o, FLOW[idx + 1]);
  res.json({ ok: true, status: o.status });
});

router.post('/orders/:id/cancel', async (req, res) => {
  const [[o]] = await db.query('SELECT * FROM orders WHERE id = ? AND shop_id = ?', [req.params.id, req.shop.id]);
  if (!o) return res.status(404).json({ error: 'Order not found.' });
  if (!['Placed', 'Packed'].includes(o.status)) return res.status(400).json({ error: 'Shipped orders cannot be cancelled.' });
  const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
  for (const it of items) await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [it.qty, it.product_id]);
  if (o.payment_status === 'Paid') await db.query("UPDATE orders SET payment_status = 'Refunded' WHERE id = ?", [o.id]);
  await setStatus(db, o, 'Cancelled');
  res.json({ ok: true });
});

module.exports = router;
