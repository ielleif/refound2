const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Defaults match a fresh XAMPP install (root, no password).
// For an online database (e.g. TiDB Cloud) set DB_SSL=true to use an encrypted connection.
const DB_NAME = process.env.DB_NAME || 'refound2';
const base = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ...(process.env.DB_SSL === 'true' ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
};

const pool = mysql.createPool({
  ...base,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});

// If the database is missing or empty, create it from database/schema.sql (tables + demo data).
// This means a brand-new online database sets itself up on the first start.
pool.initDatabase = async function initDatabase() {
  const conn = await mysql.createConnection({ ...base, multipleStatements: true });
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${DB_NAME}\``);
    const [rows] = await conn.query("SHOW TABLES LIKE 'products'");
    if (rows.length) return false; // already set up
    let sql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    // The file starts by (re)creating the database itself; we're already inside it.
    sql = sql.split('\n').filter(l => !/^\s*(DROP DATABASE|CREATE DATABASE|USE)\b/i.test(l)).join('\n');
    await conn.query(sql);
    return true;
  } finally {
    await conn.end();
  }
};

module.exports = pool;
