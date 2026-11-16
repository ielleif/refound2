// Public browsing: categories, products, shop pages.
const router = require('express').Router();
const db = require('../db');
const { attachImages } = require('../images');

const PRODUCT_SELECT = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name,
         s.name AS shop_name, s.slug AS shop_slug, s.location AS shop_location, s.color AS shop_color
  FROM products p
  JOIN categories c ON c.id = p.category_id
  JOIN shops s ON s.id = p.shop_id`;

router.get('/categories', async (_req, res) => {
  const [rows] = await db.query(`
    SELECT c.*, COUNT(p.id) AS product_count FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1 AND p.stock > 0
    GROUP BY c.id ORDER BY c.id`);
  res.json(rows);
});

router.get('/products', async (req, res) => {
  const { q, category, shop, sort, min, max, condition, limit } = req.query;
  const where = ['p.is_active = 1'];
  const args = [];
  if (q) { where.push('(p.name LIKE ? OR p.description LIKE ? OR p.era LIKE ?)'); args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (category) { where.push('c.slug = ?'); args.push(category); }
  if (shop) { where.push('s.slug = ?'); args.push(shop); }
  if (min) { where.push('p.price >= ?'); args.push(Number(min)); }
  if (max) { where.push('p.price <= ?'); args.push(Number(max)); }
  if (condition) { where.push('p.condition_grade = ?'); args.push(condition); }
  const order = {
    price_asc: 'p.price ASC', price_desc: 'p.price DESC',
    oldest: 'p.era ASC', newest: 'p.created_at DESC',
  }[sort] || 'p.stock = 0, p.created_at DESC, p.id DESC';
  let sql = `${PRODUCT_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${order}`;
  if (limit) { sql += ' LIMIT ?'; args.push(Number(limit)); }
  const [rows] = await db.query(sql, args);
  res.json(rows);
});

router.get('/products/:id', async (req, res) => {
  const [[product]] = await db.query(`${PRODUCT_SELECT} WHERE p.id = ?`, [req.params.id]);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  await attachImages([product]);
  const [related] = await db.query(
    `${PRODUCT_SELECT} WHERE p.is_active = 1 AND p.id <> ? AND (p.category_id = ? OR p.shop_id = ?)
     ORDER BY RAND() LIMIT 4`, [product.id, product.category_id, product.shop_id]);
  res.json({ product, related });
});

router.get('/shops', async (_req, res) => {
  const [rows] = await db.query(`
    SELECT s.*, COUNT(p.id) AS product_count FROM shops s
    LEFT JOIN products p ON p.shop_id = s.id AND p.is_active = 1
    GROUP BY s.id ORDER BY s.created_at, s.id`);
  res.json(rows);
});

router.get('/shops/:slug', async (req, res) => {
  const [[shop]] = await db.query(`
    SELECT s.*, u.name AS owner_name,
      (SELECT COUNT(*) FROM orders o WHERE o.shop_id = s.id AND o.status = 'Delivered') AS sold_count
    FROM shops s JOIN users u ON u.id = s.user_id WHERE s.slug = ?`, [req.params.slug]);
  if (!shop) return res.status(404).json({ error: 'Shop not found.' });
  const [products] = await db.query(`${PRODUCT_SELECT} WHERE p.is_active = 1 AND p.shop_id = ? ORDER BY p.created_at DESC`, [shop.id]);
  res.json({ shop, products });
});

// Contact form (public). Saved so the team can read it later.
router.post('/contact', async (req, res) => {
  const { name, email, topic, message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim())
    return res.status(400).json({ error: 'Please fill in your name, email and message.' });
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (message.trim().length < 10) return res.status(400).json({ error: 'Your message is a bit short. Tell us a little more.' });
  const ticket = 'RF-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  await db.query('INSERT INTO contact_messages (ticket, name, email, topic, message) VALUES (?,?,?,?,?)',
    [ticket, name.trim().slice(0, 100), email.trim().slice(0, 150), (topic || 'Other').slice(0, 40), message.trim().slice(0, 5000)]);
  res.json({ ok: true, ticket });
});

// Small numbers for the About page
router.get('/stats', async (_req, res) => {
  const [[r]] = await db.query(`SELECT
    (SELECT COUNT(*) FROM products WHERE is_active = 1) AS products,
    (SELECT COUNT(*) FROM shops) AS shops,
    (SELECT COUNT(*) FROM users) AS members,
    (SELECT COUNT(*) FROM orders WHERE status = 'Delivered') AS delivered`);
  res.json(r);
});

module.exports = router;
