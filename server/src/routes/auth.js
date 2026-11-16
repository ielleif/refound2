const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sign, requireAuth } = require('../auth');

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

router.put('/me', requireAuth, async (req, res) => {
  const { name, phone, address } = req.body;
  await db.query('UPDATE users SET name = COALESCE(?, name), phone = ?, address = ? WHERE id = ?',
    [name?.trim() || null, phone || null, address || null, req.user.id]);
  const [[user]] = await db.query('SELECT id, name, email, phone, address FROM users WHERE id = ?', [req.user.id]);
  res.json({ user });
});

module.exports = router;
