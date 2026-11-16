// Shared order / mock-shipment helpers.
const db = require('./db');

const FLOW = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const COURIERS = {
  'J&T Express': 85,
  'LBC Express': 120,
  'Ninja Van': 95,
  'Lalamove (Same-day)': 220,
};

function note(status, order) {
  switch (status) {
    case 'Placed': return 'Order placed. Waiting for the seller to pack your item.';
    case 'Packed': return 'Seller has packed your parcel and is waiting for courier pickup.';
    case 'Shipped': return `Parcel picked up by ${order.courier}. Tracking no. ${order.tracking_no}`;
    case 'Out for Delivery': return 'Your parcel is out for delivery. Please keep your phone nearby.';
    case 'Delivered': return 'Parcel delivered. Salamat sa pagbili!';
    case 'Cancelled': return 'Order was cancelled.';
    default: return status;
  }
}

function trackingNo(courier) {
  const prefix = { 'J&T Express': 'JT', 'LBC Express': 'LBC', 'Ninja Van': 'NVPH', 'Lalamove (Same-day)': 'LLM' }[courier] || 'RF';
  return prefix + Math.floor(1e9 + Math.random() * 9e9);
}

// Moves an order to a new status and logs the shipment event.
async function setStatus(conn, order, status) {
  const updates = { status };
  if (status === 'Shipped' && !order.tracking_no) updates.tracking_no = order.tracking_no = trackingNo(order.courier);
  if (status === 'Delivered' && order.payment_method === 'COD') updates.payment_status = 'Paid';
  const keys = Object.keys(updates);
  await conn.query(`UPDATE orders SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`,
    [...keys.map(k => updates[k]), order.id]);
  await conn.query('INSERT INTO shipment_events (order_id, status, note) VALUES (?,?,?)',
    [order.id, status, note(status, order)]);
  order.status = status;
}

// Demo shops have nobody behind them, so their orders move along on their own:
// one step every 45 seconds, so you can watch a full mock shipment in ~3 minutes.
const DEMO_STEP_SECONDS = 45;
async function progressDemoOrders(where, args) {
  const [rows] = await db.query(`
    SELECT o.*, TIMESTAMPDIFF(SECOND, o.created_at, NOW()) AS age
    FROM orders o JOIN shops s ON s.id = o.shop_id
    WHERE s.is_demo = 1 AND o.status NOT IN ('Delivered','Cancelled') AND ${where}`, args);
  for (const o of rows) {
    const target = Math.min(FLOW.length - 1, Math.floor(o.age / DEMO_STEP_SECONDS));
    let idx = FLOW.indexOf(o.status);
    while (idx < target) { idx++; await setStatus(db, o, FLOW[idx]); }
  }
}

module.exports = { FLOW, COURIERS, note, setStatus, progressDemoOrders };
