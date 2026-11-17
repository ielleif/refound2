const jwt = require('jsonwebtoken');
const db = require('./db');

// The secret signs login tokens. Online it must be set (otherwise anyone could forge a login).
const SECRET = process.env.JWT_SECRET || (process.env.RENDER || process.env.NODE_ENV === 'production' ? null : 'refound-dev-secret');
if (!SECRET) throw new Error('JWT_SECRET is not set. Add it as an environment variable.');

function sign(user) {
  return jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
}

// Requires a logged-in user. Attaches req.user and req.shop (if they own one).
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in first.' });
  try {
    const { id } = jwt.verify(token, SECRET);
    const [[user]] = await db.query(
      'SELECT id, name, email, phone, address, avatar_url, cover_url, created_at FROM users WHERE id = ?', [id]);
    if (!user) return res.status(401).json({ error: 'Account not found.' });
    const [[shop]] = await db.query('SELECT * FROM shops WHERE user_id = ?', [id]);
    req.user = user;
    req.shop = shop || null;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// Requires that the logged-in user has a shop (seller platform routes).
function requireShop(req, res, next) {
  if (!req.shop) return res.status(403).json({ error: 'You need a seller shop for this.' });
  next();
}

module.exports = { sign, requireAuth, requireShop };
