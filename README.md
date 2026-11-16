# re:found 2 — Pop-collage edition

This is a second UI design for RE:FOUND. It has the same features as the first version, with a new look: chunky 3D lettering, cream blobs, halftone dots, stickers, polaroids, lightning bolts and taped labels. It is **fully separate** from the first version:

| | Original (`refound`) | This version (`refound2`) |
|---|---|---|
| Website | http://localhost:5173 | **http://localhost:5174** |
| API | port 5050 | **port 5051** |
| Database | `refound` | **`refound2`** |
| Seller photos | `refound/server/uploads` | `refound2/server/uploads` |

Orders, chats, accounts and listings in one version never show up in the other. You can run both at the same time.

### 1. Create the database (once)
In phpMyAdmin (http://localhost/phpmyadmin), open the **Import** tab, choose **`refound2/database/schema.sql`** and click **Import**. The file creates the `refound2` database by itself, so you don't need to make an empty one first. If you already made one, the import replaces it. The `refound` database is not touched.

### 2. Run it
First time only, copy `server\.env.example` to `server\.env` (it already has the right settings: database `refound2`, port 5051). `.env` is not uploaded to Git.

Open two Command Prompts:
```
cd C:\xampp82\htdocs\refound2\server
copy .env.example .env
npm install
npm start
```
```
cd C:\xampp82\htdocs\refound2\client
npm install
npm run dev
```
Then open **http://localhost:5174**. You only need `npm install` the first time. The fonts are bundled with the project, so the design looks the same offline.

The demo accounts are the same as in the first version (`juan@refound.ph` / `password123`, and so on), but they live in their own database.

---

## Details

## Demo accounts

All passwords are `password123`.

| Email | Role |
|---|---|
| `juan@refound.ph` | Buyer with no shop yet. Use this account to try "Open a shop". |
| `ben@refound.ph` | Owns *Tindahan ni Mang Ben* |
| `mela@refound.ph` | Owns *Kahon ng Laruan* |
| `pao@refound.ph` | Owns *Pager & Pixels* |
| `rose@refound.ph` | Owns *Lola's Baul* |
| `dennis@refound.ph` | Owns *Sari-Sari Archives* |

You can also sign up with any email.

## Features

**Buyers**
- Sign up, log in, and edit your profile and default address
- Browse by category, search, filter by condition and price, and sort
- Product pages with era, condition, stock and seller info
- A cart grouped by shop, where you choose which items to check out
- **Mock checkout:** shipping address → courier (J&T, LBC, Ninja Van, Lalamove) → payment
  - GCash and Maya: a mock e-wallet screen (any 4–6 digit MPIN works)
  - Card: card form plus a mock 3-D Secure OTP (any 6 digits work)
  - COD: marked Paid when the order is delivered
- Orders are split per shop, like Shopee or Lazada. Each one has a payment reference and a tracking number.
- **Mock shipment tracking:** Placed → Packed → Shipped → Out for Delivery → Delivered, with a timeline of updates
- Cancel an order before it's packed (stock is restored and payment refunded), or confirm receipt once it ships
- **Chat with sellers** from any product, shop or order. The product you came from is attached as a card in the chat.

**Sellers (shop "page" bound to your personal account)**
- Apply from **Open a shop**. Approval is instant because there's no admin.
- Use the account menu to switch to your shop, and **Switch to [your name]** to go back. You stay logged in the whole time, like a Facebook page.
- Seller Studio:
  - **Dashboard:** revenue, orders to ship, listings and unread chats
  - **Listings:** add, edit and delete items (name, price, stock, category, condition, era, description, optional photo URL), with a live preview
  - **Orders:** move each order through the shipment steps, or cancel it
  - **Inbox:** reply to buyers
  - **Shop settings:** name, tagline, location, about, and banner colour
- You can't buy from your own shop.

**Demo shop behaviour.** Nobody runs the 5 seeded shops, so they act on their own:
- Their orders move forward one shipment step **every 45 seconds**. You can watch a full delivery in about 3 minutes.
- They send a friendly auto-reply when you message them.

Shops created by real users never do this. Their owners update orders and reply to chats themselves.

## Project structure

```
refound/
├── database/schema.sql      # Tables + seed data (import in phpMyAdmin)
├── server/                  # Express API
│   ├── .env.example         # Copy to .env: DB connection (XAMPP defaults)
│   └── src/
│       ├── index.js         # App entry, routes, error handling
│       ├── db.js            # MySQL connection pool
│       ├── auth.js          # JWT login middleware
│       ├── orders.js        # Shipment flow + demo auto-progress
│       └── routes/          # auth, catalog, shopping (cart/checkout/orders), seller, chat
└── client/                  # React app (Vite)
    └── src/
        ├── App.jsx          # Routes
        ├── api.js           # fetch wrapper + ₱ formatting
        ├── context/         # Logged-in user, shop, cart, unread counts, toasts
        ├── components/      # Header, Footer, ProductArt, ChatView, SellerLayout…
        ├── pages/           # Storefront pages
        │   └── seller/      # Seller Studio pages
        └── styles.css       # Vintage theme
```

## Notes

- Products without a photo get an illustrated "vintage label" made in code. Sellers can paste an image URL to use a real photo instead.
- Chat refreshes every few seconds (polling), so it needs no extra libraries.
- No real payments are processed anywhere.
- **Troubleshooting:**
  - "Cannot reach the MySQL database": make sure MySQL is running in XAMPP and `schema.sql` has been imported.
  - "Cannot reach the server": make sure `npm start` is running in `server`.
