# re:found

**Find your Pinoy nostalgia here.**

re:found is a mock e-commerce marketplace for discontinued Filipino products and collectibles: the things that once sat on a sari-sari shelf, in a lunchbox, or under the bed.

- Vintage toys and childhood collectibles (fast-food kiddie meal toys, tex, teks, tamiya)
- Discontinued snacks and collectible packaging
- Old gadgets and electronic devices (pagers, brick phones, walkmans, brick games)
- Vintage brand merchandise and promotional items
- Old magazines, books and komiks
- Advertising memorabilia (tin signs, calendars, store posters)

> This is a mock store. Checkout, payment and shipping are all simulated, and no real money is involved.

---

## Design

The interface uses a **retro pop-collage** style inspired by vintage print ads and scrapbooks:

- **Palette:** red, orange and cream, with mustard yellow accents and dark ink outlines
- **Typography:** chunky 3D halftone headlines (*Ultra*), elegant serif titles (*DM Serif Display*), handwritten notes (*Permanent Marker*) and clean body text (*Poppins*). All fonts are bundled, so it looks the same offline.
- **Collage details:** wobbly cream frames, halftone dot corners, tilted stickers, taped polaroids, lightning bolts, hand-drawn arrows and squiggles
- **Tactile UI:** thick outlines and hard drop shadows on buttons and cards that lift when hovered
- **Responsive:** works on desktop, tablet and mobile, with a collapsible menu on small screens

## Technologies

| Layer | Tech |
|---|---|
| Frontend | **React 18**, React Router, **Vite** |
| Styling | Hand-written **CSS** (custom properties, container queries, SVG decorations) |
| Backend | **Node.js** + **Express** (a small REST API between React and the database) |
| Database | **MySQL** (XAMPP / MariaDB) via `mysql2` |
| Auth | Password hashing with `bcryptjs`, login sessions with **JWT** |
| Languages | JavaScript, HTML, CSS, SQL |

## Features

**Shopping**
- Sign up and log in
- Browse by collection, search, and filter by condition and price
- Product pages with a photo carousel (up to 7 photos), a full-screen viewer, era, condition and stock
- Cart grouped by shop, where you choose which items to check out
- **Mock checkout:** shipping address, courier (J&T, LBC, Ninja Van, Lalamove), then payment by GCash, Maya, card (with a mock OTP) or COD
- **Mock shipment tracking:** Placed → Packed → Shipped → Out for Delivery → Delivered, with a timeline
- Order history with cancel and "order received" actions

**Selling**
- Any user can open a shop. It's approved instantly (there's no admin) and bound to their personal account, like a Facebook page, so they can switch between buyer and seller without logging out.
- **Seller Studio:** dashboard, listings (add, edit or delete items with up to 7 photos), orders (move parcels through each shipping step), inbox and shop settings

**Chat**
- Buyers can message any seller from a product, shop or order, and the item they're asking about is attached to the message

**Pages**
- Home, Shop, Collections, Sellers, About, and Contact (the contact form saves messages to the database)

---

## Getting started

### Requirements
- [XAMPP](https://www.apachefriends.org/) (for MySQL and phpMyAdmin)
- [Node.js](https://nodejs.org/) (LTS version)

### 1. Create the database
1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Open <http://localhost/phpmyadmin>, go to the **Import** tab, choose `database/schema.sql`, and click **Import**.

This creates the `refound2` database with demo shops and products.

### 2. Start the server
```
cd server
copy .env.example .env
npm install
npm start
```
Wait for `MySQL connected - 32 products...` and keep this window open.

`.env` uses XAMPP's defaults (user `root`, no password). If your MySQL has a password, set `DB_PASSWORD` in `server/.env`.

### 3. Start the website
In a second terminal:
```
cd client
npm install
npm run dev
```
Then open **<http://localhost:5174>**.

You only need `npm install` the first time.

## Demo accounts

All demo passwords are `password123`.

| Email | Role |
|---|---|
| `juan@refound.ph` | Buyer with no shop yet. Use this account to try opening one. |
| `ben@refound.ph` | Seller: *Tindahan ni Mang Ben* |
| `mela@refound.ph` | Seller: *Kahon ng Laruan* |
| `pao@refound.ph` | Seller: *Pager & Pixels* |
| `rose@refound.ph` | Seller: *Lola's Baul* |
| `dennis@refound.ph` | Seller: *Sari-Sari Archives* |

Nobody runs the demo shops, so they act on their own: their orders move forward one shipping step about every 45 seconds, and they send an automatic reply to chat messages.

## Project structure

```
├── database/
│   └── schema.sql          # Tables + demo data (import in phpMyAdmin)
├── server/                 # Express API
│   ├── .env.example        # Copy to .env (database connection, port)
│   └── src/
│       ├── index.js        # App entry, routes, error handling
│       ├── db.js           # MySQL connection pool
│       ├── auth.js         # JWT login middleware
│       ├── orders.js       # Mock shipment flow
│       ├── images.js       # Photo uploads + extra tables
│       └── routes/         # auth, catalog, shopping, seller, chat
└── client/                 # React app (Vite)
    └── src/
        ├── App.jsx         # Routes
        ├── components/     # Header, Footer, collage decorations, carousel, chat…
        ├── pages/          # Storefront, About, Contact
        │   └── seller/     # Seller Studio
        └── styles.css      # Pop-collage theme
```

## Troubleshooting

- **"Cannot reach the MySQL database":** start MySQL in XAMPP and import `database/schema.sql`.
- **"Port … is already used by another program":** change `PORT` in `server/.env` to another number, then restart `npm start` and `npm run dev`.
- **The page loads but shows no products:** make sure the server window (`npm start`) is still running.
