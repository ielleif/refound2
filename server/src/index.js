require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
// Photo uploads arrive as base64 JSON, so that one route accepts bigger bodies.
app.use('/api/seller/uploads', express.json({ limit: '40mb' }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(require('./images').UPLOAD_DIR, { maxAge: '7d' }));

// Express 4 doesn't catch async errors — wrap every route handler.
const wrap = router => {
  router.stack.forEach(layer => {
    if (layer.route) layer.route.stack.forEach(s => {
      const fn = s.handle;
      s.handle = (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
    });
  });
  return router;
};

app.use('/api/auth', wrap(require('./routes/auth')));
app.use('/api', wrap(require('./routes/catalog')));
app.use('/api', wrap(require('./routes/shopping').router));
app.use('/api/seller', wrap(require('./routes/seller')));
app.use('/api/chat', wrap(require('./routes/chat')));

app.get('/api/health', async (_req, res) => {
  await db.query('SELECT 1');
  res.json({ ok: true });
});

// Serve the built React app (after `npm run build` in /client)
const dist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  const dbDown = ['ECONNREFUSED', 'ER_BAD_DB_ERROR', 'ER_ACCESS_DENIED_ERROR'].includes(err.code);
  res.status(500).json({
    error: dbDown ? 'Cannot reach the MySQL database. Is XAMPP MySQL running and schema.sql imported?' : 'Something went wrong.',
  });
});

const PORT = Number(process.env.PORT || 5000);
const server = app.listen(PORT, err => {
  if (err) return; // handled by the 'error' listener below
  console.log(`RE:FOUND API running on http://localhost:${PORT}`);
  console.log('Keep this window open. Press Ctrl+C to stop.');
  // Check the database right away so problems show up here, not in the browser.
  require('./images').ensureSchema()
    .then(() => db.query('SELECT COUNT(*) AS n FROM products'))
    .then(([[r]]) => console.log(`MySQL connected - ${r.n} products in the ${process.env.DB_NAME || 'refound2'} database.`))
    .catch(e => console.error(`\n!! MySQL problem: ${e.code || e.message}\n   Is MySQL running in XAMPP, and did you import refound2/database/schema.sql?\n`));
});
server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n!! Port ${PORT} is already used by another program.`);
    console.error('   Fix: open server/.env, change PORT=5000 to PORT=5050, and run npm start again.\n');
  } else {
    console.error('\n!! Could not start the server:', err.message, '\n');
  }
  process.exit(1);
});
