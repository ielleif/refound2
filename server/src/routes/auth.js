const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sign, requireAuth } = require('../auth');
const { saveUploads, cleanPhoto } = require('../images');

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password)
    return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const [[exists]] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (exists) return res.status(409).json({ error: 'That email is already registered.' });
  const hash = await bcrypt.hash(password, 10);
  const [r] = await db.query('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)',
    [name.trim(), email.trim().toLowerCase(), hash]);
  const user = { id: r.insertId, name: name.trim(), email: email.trim().toLowerCase() };
  res.json({ token: sign(user), user, shop: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [[user]] = await db.query('SELECT * FROM users WHERE email = ?', [(email || '').trim().toLowerCase()]);
  if (!user || !(await bcrypt.compare(password || '', user.password_hash)))
    return res.status(401).json({ error: 'Incorrect email or password.' });
  const [[shop]] = await db.query('SELECT * FROM shops WHERE user_id = ?', [user.id]);
  delete user.password_hash;
  res.json({ token: sign(user), user, shop: shop || null });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user, shop: req.shop }));

// Update only the profile fields that were sent (name, phone, address, avatar_url, cover_url)
router.put('/me', requireAuth, async (req, res) => {
  const b = req.body, set = {};
  if ('name' in b) {
    if (!b.name?.trim()) return res.status(400).json({ error: 'Name cannot be empty.' });
    set.name = b.name.trim().slice(0, 100);
  }
  if ('phone' in b) set.phone = b.phone?.trim() || null;
  if ('address' in b) set.address = b.address?.trim() || null;
  for (const k of ['avatar_url', 'cover_url']) {
    if (k in b) {
      const v = cleanPhoto(b[k]);
      if (v === undefined) return res.status(400).json({ error: 'That photo link is not allowed.' });
      set[k] = v;
    }
  }
  const keys = Object.keys(set);
  if (keys.length) await db.query(`UPDATE users SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`, [...keys.map(k => set[k]), req.user.id]);
  const [[user]] = await db.query('SELECT id, name, email, phone, address, avatar_url, cover_url, created_at FROM users WHERE id = ?', [req.user.id]);
  res.json({ user });
});

// Photo upload for any logged-in user (profile picture, cover photo)
router.post('/uploads', requireAuth, async (req, res) => {
  try { res.json({ urls: saveUploads(req.body.images) }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
