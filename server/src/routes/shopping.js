// Buyer side: cart, mock checkout + payment, orders and shipment tracking.
const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');
const { COURIERS, note, setStatus, progressDemoOrders } = require('../orders');

router.use(['/cart', '/couriers', '/checkout', '/orders'], requireAuth);

// ---------- Cart ----------
async function getCart(userId) {
  const [rows] = await db.query(`
    SELECT ci.product_id, ci.qty, p.name, p.price, p.stock, p.image_url, p.art_color, p.era,
           p.condition_grade, p.is_active, c.slug AS category_slug,
           s.id AS shop_id, s.name AS shop_name, s.slug AS shop_slug
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    JOIN categories c ON c.id = p.category_id
    JOIN shops s ON s.id = p.shop_id
    WHERE ci.user_id = ? ORDER BY s.name, ci.id`, [userId]);
  return rows;
}

router.get('/cart', async (req, res) => res.json(await getCart(req.user.id)));

router.get('/couriers', (_req, res) => res.json(COURIERS));

router.post('/cart', async (req, res) => {
  const productId = Number(req.body.productId);
  const qty = Math.max(1, Number(req.body.qty) || 1);
  const [[p]] = await db.query('SELECT * FROM products WHERE id = ? AND is_active = 1', [productId]);
  if (!p) return res.status(404).json({ error: 'This item is no longer available.' });
  if (req.shop && p.shop_id === req.shop.id)
    return res.status(400).json({ error: "You can't buy from your own shop." });
  const [[existing]] = await db.query('SELECT qty FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
  if (p.stock < 1) return res.status(400).json({ error: 'Sorry, this item is sold out.' });
  const have = existing?.qty || 0;
  if (have >= p.stock)
    return res.status(400).json({ error: p.stock === 1
      ? 'This one-of-a-kind item is already in your cart.'
      : `You already have all ${p.stock} available in your cart.` });
  const newQty = Math.min(p.stock, have + qty);
  await db.query(`INSERT INTO cart_items (user_id, product_id, qty) VALUES (?,?,?)
                  ON DUPLICATE KEY UPDATE qty = VALUES(qty)`, [req.user.id, productId, newQty]);
  res.json(await getCart(req.user.id));
});

router.put('/cart/:productId', async (req, res) => {
  const [[p]] = await db.query('SELECT stock FROM products WHERE id = ?', [req.params.productId]);
  const qty = Math.max(1, Math.min(p?.stock || 1, Number(req.body.qty) || 1));
  await db.query('UPDATE cart_items SET qty = ? WHERE user_id = ? AND product_id = ?', [qty, req.user.id, req.params.productId]);
  res.json(await getCart(req.user.id));
});

router.delete('/cart/:productId', async (req, res) => {
  await db.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
  res.json(await getCart(req.user.id));
});

// ---------- Checkout (mock payment) ----------
router.post('/checkout', async (req, res) => {
  const { ship_name, ship_phone, ship_address, courier, payment_method, productIds } = req.body;
  if (!ship_name || !ship_phone || !ship_address) return res.status(400).json({ error: 'Complete your shipping details.' });
  if (!COURIERS[courier]) return res.status(400).json({ error: 'Choose a courier.' });
  if (!['GCash', 'Maya', 'Card', 'COD'].includes(payment_method)) return res.status(400).json({ error: 'Choose a payment method.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let sql = `SELECT ci.qty, p.* FROM cart_items ci JOIN products p ON p.id = ci.product_id
               WHERE ci.user_id = ?`;
    const args = [req.user.id];
    if (Array.isArray(productIds) && productIds.length) { sql += ' AND p.id IN (?)'; args.push(productIds); }
    const [items] = await conn.query(sql + ' FOR UPDATE', args);
    if (!items.length) throw new Error('Your cart is empty.');

    for (const it of items) {
      if (!it.is_active || it.stock < it.qty) throw new Error(`Sorry, "${it.name}" just sold out or has limited stock.`);
      if (req.shop && it.shop_id === req.shop.id) throw new Error("You can't buy from your own shop.");
    }

    // Split into one order per shop
    const byShop = {};
    items.forEach(it => (byShop[it.shop_id] ||= []).push(it));
    const paid = payment_method !== 'COD';
    const created = [];
    for (const [shopId, list] of Object.entries(byShop)) {
      const subtotal = list.reduce((s, it) => s + Number(it.price) * it.qty, 0);
      const fee = COURIERS[courier];
      const orderNo = 'RF-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const payRef = paid ? payment_method.slice(0, 2).toUpperCase() + Math.floor(1e8 + Math.random() * 9e8) : null;
      const [r] = await conn.query(`
        INSERT INTO orders (order_no, user_id, shop_id, subtotal, shipping_fee, total, payment_method,
          payment_status, payment_ref, ship_name, ship_phone, ship_address, courier)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [orderNo, req.user.id, shopId, subtotal, fee, subtotal + fee, payment_method,
         paid ? 'Paid' : 'Pending', payRef, ship_name, ship_phone, ship_address, courier]);
      for (const it of list) {
        await conn.query('INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?,?,?,?,?)',
          [r.insertId, it.id, it.name, it.price, it.qty]);
        await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [it.qty, it.id]);
      }
      await conn.query('INSERT INTO shipment_events (order_id, status, note) VALUES (?,?,?)',
        [r.insertId, 'Placed', note('Placed')]);
      created.push({ id: r.insertId, order_no: orderNo, total: subtotal + fee, payment_ref: payRef });
    }
    await conn.query('DELETE FROM cart_items WHERE user_id = ? AND product_id IN (?)', [req.user.id, items.map(i => i.id)]);
    // Remember the address for next time
    await conn.query('UPDATE users SET phone = COALESCE(phone, ?), address = COALESCE(address, ?) WHERE id = ?',
      [ship_phone, ship_address, req.user.id]);
    await conn.commit();
    res.json({ orders: created });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// ---------- Orders ----------
async function loadOrders(where, args) {
  const [orders] = await db.query(`
    SELECT o.*, s.name AS shop_name, s.slug AS shop_slug, u.name AS buyer_name
    FROM orders o JOIN shops s ON s.id = o.shop_id JOIN users u ON u.id = o.user_id
    WHERE ${where} ORDER BY o.created_at DESC, o.id DESC`, args);
  if (!orders.length) return [];
  const ids = orders.map(o => o.id);
  const [items] = await db.query(`
    SELECT oi.*, p.art_color, p.image_url, c.slug AS category_slug
    FROM order_items oi JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id
    WHERE oi.order_id IN (?)`, [ids]);
  const [events] = await db.query('SELECT * FROM shipment_events WHERE order_id IN (?) ORDER BY created_at, id', [ids]);
  return orders.map(o => ({
    ...o,
    items: items.filter(i => i.order_id === o.id),
    events: events.filter(e => e.order_id === o.id),
  }));
}

router.get('/orders', async (req, res) => {
  await progressDemoOrders('o.user_id = ?', [req.user.id]);
  res.json(await loadOrders('o.user_id = ?', [req.user.id]));
});

router.get('/orders/:id', async (req, res) => {
  await progressDemoOrders('o.user_id = ? AND o.id = ?', [req.user.id, req.params.id]);
  const [order] = await loadOrders('o.user_id = ? AND o.id = ?', [req.user.id, req.params.id]);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
});

router.post('/orders/:id/cancel', async (req, res) => {
  const [[o]] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!o) return res.status(404).json({ error: 'Order not found.' });
  if (o.status !== 'Placed') return res.status(400).json({ error: 'Only orders that have not been packed can be cancelled.' });
  const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
  for (const it of items) await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [it.qty, it.product_id]);
  if (o.payment_status === 'Paid') await db.query("UPDATE orders SET payment_status = 'Refunded' WHERE id = ?", [o.id]);
  await setStatus(db, o, 'Cancelled');
  res.json({ ok: true });
});

router.post('/orders/:id/receive', async (req, res) => {
  const [[o]] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!o) return res.status(404).json({ error: 'Order not found.' });
  if (!['Shipped', 'Out for Delivery'].includes(o.status))
    return res.status(400).json({ error: 'You can confirm receipt once the parcel has shipped.' });
  await setStatus(db, o, 'Delivered');
  res.json({ ok: true });
});

module.exports = { router, loadOrders };
