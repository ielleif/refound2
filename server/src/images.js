// Product photos: up to 7 per listing, stored as files in server/uploads/.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const MAX_IMAGES = 7;
const MAX_BYTES = 6 * 1024 * 1024; // per photo, after the browser shrinks it
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

// Creates the photos table if the database was imported before this feature existed.
async function ensureSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      url        VARCHAR(500) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`);
  // Messages sent from the Contact page
  await db.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      ticket     VARCHAR(20) NOT NULL,
      user_id    INT DEFAULT NULL,
      name       VARCHAR(100) NOT NULL,
      email      VARCHAR(150) NOT NULL,
      topic      VARCHAR(40) NOT NULL,
      message    TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Saves base64 data URLs sent by the browser; returns their public URLs.
function saveUploads(dataUrls) {
  if (!Array.isArray(dataUrls) || !dataUrls.length) throw new Error('No photos received.');
  if (dataUrls.length > MAX_IMAGES) throw new Error(`You can upload up to ${MAX_IMAGES} photos at a time.`);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  return dataUrls.map(d => {
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(d || '');
    if (!m) throw new Error('Only JPG, PNG, WEBP or GIF photos are allowed.');
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > MAX_BYTES) throw new Error('One of the photos is too large (max 6 MB).');
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${EXT[m[1]]}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
    return `/uploads/${name}`;
  });
}

// Keeps only safe URLs (our uploads or http/https links), max 7.
const cleanList = list => (Array.isArray(list) ? list : [])
  .filter(u => typeof u === 'string' && /^(\/uploads\/[\w.-]+|https?:\/\/\S+)$/.test(u.trim()))
  .map(u => u.trim()).slice(0, MAX_IMAGES);

// Replaces a product's photos; the first one becomes the cover (products.image_url).
async function setProductImages(productId, list) {
  const urls = cleanList(list);
  await db.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
  for (let i = 0; i < urls.length; i++) {
    await db.query('INSERT INTO product_images (product_id, url, sort_order) VALUES (?,?,?)', [productId, urls[i], i]);
  }
  await db.query('UPDATE products SET image_url = ? WHERE id = ?', [urls[0] || null, productId]);
}

// Adds `images: [url, …]` to each product row.
async function attachImages(products) {
  if (!products.length) return products;
  const [rows] = await db.query(
    'SELECT product_id, url FROM product_images WHERE product_id IN (?) ORDER BY sort_order, id',
    [products.map(p => p.id)]);
  for (const p of products) {
    const imgs = rows.filter(r => r.product_id === p.id).map(r => r.url);
    p.images = imgs.length ? imgs : p.image_url ? [p.image_url] : [];
  }
  return products;
}

module.exports = { MAX_IMAGES, UPLOAD_DIR, ensureSchema, saveUploads, setProductImages, attachImages };
