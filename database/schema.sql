-- =========================================================
--  re:found 2 — pop-collage edition (its own database: refound2)
--  Import this file in phpMyAdmin (Import tab) or run:
--    mysql -u root < schema.sql
--  It creates the `refound2` database by itself, so you don't need to
--  create it first. The original `refound` database is not touched.
--  Re-importing resets the database to the demo state.
-- =========================================================

DROP DATABASE IF EXISTS refound2;
CREATE DATABASE refound2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE refound2;

-- ---------- Accounts ----------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(30)  DEFAULT NULL,
  address       VARCHAR(255) DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A user can own exactly one shop (their "page"), auto-approved.
CREATE TABLE shops (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  tagline     VARCHAR(160) DEFAULT NULL,
  description TEXT,
  location    VARCHAR(100) DEFAULT NULL,
  color       VARCHAR(20)  DEFAULT '#D9412B',
  is_demo     TINYINT(1)   DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- Catalogue ----------
CREATE TABLE categories (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  slug  VARCHAR(40) NOT NULL UNIQUE,
  name  VARCHAR(80) NOT NULL,
  blurb VARCHAR(200)
);

CREATE TABLE products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  shop_id         INT NOT NULL,
  category_id     INT NOT NULL,
  name            VARCHAR(150) NOT NULL,
  price           DECIMAL(10,2) NOT NULL,
  description     TEXT,
  condition_grade ENUM('Sealed','Mint','Excellent','Good','Fair','For Display') DEFAULT 'Good',
  era             VARCHAR(20)  DEFAULT NULL,
  stock           INT NOT NULL DEFAULT 1,
  image_url       VARCHAR(500) DEFAULT NULL,
  art_color       VARCHAR(20)  DEFAULT '#D9412B',
  is_active       TINYINT(1)   DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Up to 7 photos per product; the first one is also stored as products.image_url (cover).
CREATE TABLE product_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  url        VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ---------- Cart & Orders ----------
CREATE TABLE cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  qty        INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_cart (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- One order per shop per checkout (like Shopee/Lazada splitting parcels).
CREATE TABLE orders (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  order_no       VARCHAR(30) NOT NULL UNIQUE,
  user_id        INT NOT NULL,
  shop_id        INT NOT NULL,
  subtotal       DECIMAL(10,2) NOT NULL,
  shipping_fee   DECIMAL(10,2) NOT NULL,
  total          DECIMAL(10,2) NOT NULL,
  payment_method ENUM('GCash','Maya','Card','COD') NOT NULL,
  payment_status ENUM('Paid','Pending','Refunded') NOT NULL DEFAULT 'Pending',
  payment_ref    VARCHAR(40) DEFAULT NULL,
  ship_name      VARCHAR(100) NOT NULL,
  ship_phone     VARCHAR(30)  NOT NULL,
  ship_address   VARCHAR(255) NOT NULL,
  courier        VARCHAR(40)  NOT NULL,
  tracking_no    VARCHAR(40)  DEFAULT NULL,
  status         ENUM('Placed','Packed','Shipped','Out for Delivery','Delivered','Cancelled') DEFAULT 'Placed',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  name       VARCHAR(150) NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  qty        INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE shipment_events (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  status     VARCHAR(40) NOT NULL,
  note       VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ---------- Contact page messages ----------
CREATE TABLE contact_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  ticket     VARCHAR(20) NOT NULL,
  user_id    INT DEFAULT NULL,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  topic      VARCHAR(40) NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Chat (buyer <-> shop) ----------
CREATE TABLE conversations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id   INT NOT NULL,
  shop_id    INT NOT NULL,
  product_id INT DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conv (buyer_id, shop_id),
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender          ENUM('buyer','shop') NOT NULL,
  body            TEXT NOT NULL,
  product_id      INT DEFAULT NULL,
  is_read         TINYINT(1) DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- =========================================================
--  SEED DATA  (all demo passwords: password123)
-- =========================================================
INSERT INTO categories (id, slug, name, blurb) VALUES
(1,'toys','Toys & Childhood','Kiddie meal toys, tex, teks, tamiya and recess treasures.'),
(2,'snacks','Snacks & Packaging','Discontinued sweets and the wrappers we couldn''t throw away.'),
(3,'gadgets','Old Gadgets','Bricks, pagers, walkmans and the beep of the 90s.'),
(4,'merch','Brand Merchandise','Promo items, freebies and limited giveaways.'),
(5,'print','Magazines & Komiks','Komiks, magazines, primers and paperbacks.'),
(6,'ads','Advertising Memorabilia','Tin signs, calendars, posters and store displays.');

INSERT INTO users (id, name, email, password_hash, phone, address) VALUES
(1,'Benjamin Cruz','ben@refound.ph','$2b$10$UJeQSDCIZTfjlrWA3WnXfeVvnGpCrAPNwyobA8Pc19/zydtsOPRQy','09171234567','Sta. Cruz, Manila'),
(2,'Carmela Reyes','mela@refound.ph','$2b$10$UJeQSDCIZTfjlrWA3WnXfeVvnGpCrAPNwyobA8Pc19/zydtsOPRQy','09181234567','Malolos, Bulacan'),
(3,'Paolo Santos','pao@refound.ph','$2b$10$UJeQSDCIZTfjlrWA3WnXfeVvnGpCrAPNwyobA8Pc19/zydtsOPRQy','09191234567','Cubao, Quezon City'),
(4,'Rosario Villanueva','rose@refound.ph','$2b$10$UJeQSDCIZTfjlrWA3WnXfeVvnGpCrAPNwyobA8Pc19/zydtsOPRQy','09201234567','Vigan, Ilocos Sur'),
(5,'Dennis Lim','dennis@refound.ph','$2b$10$UJeQSDCIZTfjlrWA3WnXfeVvnGpCrAPNwyobA8Pc19/zydtsOPRQy','09211234567','Cebu City'),
(6,'Juan Dela Cruz','juan@refound.ph','$2b$10$UJeQSDCIZTfjlrWA3WnXfeVvnGpCrAPNwyobA8Pc19/zydtsOPRQy','09991234567','123 Mabini St., Brgy. San Roque, Marikina City');

INSERT INTO shops (id, user_id, name, slug, tagline, description, location, color, is_demo) VALUES
(1,1,'Tindahan ni Mang Ben','tindahan-ni-mang-ben','Sari-sari nostalgia since ''78','Old stock from my father''s sari-sari store in Sta. Cruz — wrappers, bottles, and store fixtures we never threw away.','Manila','#D9412B',1),
(2,2,'Kahon ng Laruan','kahon-ng-laruan','Recess, revisited','Kiddie meal toys, tex, teks, tamiya and everything that used to live in a shoebox under the bed.','Bulacan','#E3A82B',1),
(3,3,'Pager & Pixels','pager-and-pixels','Tested. Cleaned. Still beeping.','Refurbished gadgets from the 80s to early 2000s. Every working unit is tested before shipping.','Quezon City','#2F5D62',1),
(4,4,'Lola''s Baul','lolas-baul','Paper treasures from the old chest','Komiks, magazines, calendars and printed ephemera from my lola''s baul in Vigan.','Ilocos Sur','#1F3B2D',1),
(5,5,'Sari-Sari Archives','sari-sari-archives','Brand memories, kept','Promo merch, giveaways and advertising pieces from Philippine brands across the decades.','Cebu','#7A3E2B',1);

INSERT INTO products (shop_id, category_id, name, price, description, condition_grade, era, stock, art_color) VALUES
-- Toys (Kahon ng Laruan)
(2,1,'Kiddie Meal Spinning Top Toy',350,'Fast-food kiddie meal giveaway spinning top, still in its original sealed plastic. A recess favorite.','Sealed','1997',3,'#D9412B'),
(2,1,'Mini 4WD Racer — Unassembled Kit',1450,'Complete unassembled mini 4WD kit with stickers and motor. Box shows light shelf wear.','Mint','1996',1,'#2F5D62'),
(2,1,'Tex Card Bundle (120 pcs)',280,'Assorted tex cards from the 80s–90s, including cartoon and action series. Rubber band included, as tradition demands.','Good','1990s',5,'#E3A82B'),
(2,1,'Teks Game Cards — Komiks Series',320,'Uncut sheet-style teks with comic panels on the back. Perfect for framing.','Excellent','1980s',2,'#F26B1D'),
(2,1,'Chip Snack Tazos Collection (40 pcs)',600,'Forty plastic tazos from snack bag promos, with the original collector album.','Good','1998',1,'#7A3E2B'),
(2,1,'Fast-Food Burger Mascot Figurine',450,'Small PVC mascot figurine from a 90s kiddie meal promo. Paint still bright.','Excellent','1995',2,'#D9412B'),
-- Snacks & packaging (Mang Ben)
(1,2,'Orange Soda Glass Bottle (Discontinued)',750,'Classic ribbed glass bottle from a discontinued orange soda line. Empty, cleaned, no chips.','For Display','1980s',4,'#F26B1D'),
(1,2,'Bubble Gum Display Box (Empty)',520,'Sari-sari store counter box for a classic chewing gum brand, with comic wrapper art on the sides.','For Display','1990s',2,'#E3A82B'),
(1,2,'Chocolate Bar Wrapper Set (6 pcs)',300,'Six flattened wrappers from a local chocolate bar no longer in production. Sleeved.','Good','1980s',3,'#7A3E2B'),
(1,2,'Haw Flakes Roll — Old Packaging',180,'Sealed roll in the old paper packaging design. Not for consumption — display only.','Sealed','2003',6,'#D9412B'),
(1,2,'Fish Cracker Tin Canister',890,'Large tin canister for fish crackers, the kind that sat on every sari-sari counter. Lid intact.','Good','1970s',1,'#2F5D62'),
-- Gadgets (Pager & Pixels)
(3,3,'Easycall Alphanumeric Pager',1800,'Fully working pager with belt clip. Display is clear and the beep still works. Battery not included.','Excellent','1994',2,'#2F5D62'),
(3,3,'Classic Brick Phone 3310 (Working)',2500,'The indestructible one. Tested, holds charge for 2 days, Snake II included free of charge.','Good','2000',3,'#1E1B18'),
(3,3,'Brick Game 9999-in-1 Handheld',650,'Handheld LCD brick game. Sound toggle works. Some scratches on the screen cover.','Good','1990s',4,'#E3A82B'),
(3,3,'8-Bit Family Computer + 2 Cartridges',3200,'Family computer clone with two controllers and two cartridges. Tested on a CRT and an LCD with AV.','Good','1990s',1,'#D9412B'),
(3,3,'Portable Cassette Player with Belt Clip',2800,'Auto-reverse portable cassette player. New belts installed; plays clean. Earphones not included.','Excellent','1989',1,'#7A3E2B'),
(3,3,'Virtual Pet Egg — Original Run',2200,'Original-run virtual pet in translucent shell. New battery, screen fully readable.','Excellent','1997',1,'#F26B1D'),
-- Brand merch (Sari-Sari Archives)
(5,4,'Cola Promo Bottle Cap — "349"',1200,'One of the infamous 349 promo caps. A strange piece of Philippine marketing history.','Good','1992',1,'#1E1B18'),
(5,4,'Beer Brand Glass Mug — Old Logo',680,'Thick glass mug with the old brewery logo, from a 70s pulutan house.','Excellent','1970s',3,'#E3A82B'),
(5,4,'Telco Promo Shirt — "Buddy" Era',540,'Promo shirt from an early-2000s telco campaign. Size L, never worn.','Mint','2001',2,'#2F5D62'),
(5,4,'Christmas Mascot Plush (Promo)',950,'Fast-food Christmas promo plush with the hang tag still on.','Mint','2001',1,'#D9412B'),
(5,4,'Gas Station Promo Tumbler',380,'Plastic tumbler given out with full-tank purchases. Graphics unfaded.','Excellent','1990s',4,'#F26B1D'),
-- Print (Lola''s Baul)
(4,5,'Funny Komiks #512',420,'Classic children''s komiks issue, complete with centerfold. Slight yellowing.','Good','1988',2,'#E3A82B'),
(4,5,'Liwayway Magazine — Holiday Issue',650,'Holiday issue of the long-running Tagalog weekly, with serialized nobela and vintage ads.','Fair','1972',1,'#D9412B'),
(4,5,'Superheroine Komiks — Origin Reprint',1500,'Reprint of a classic Filipino superheroine origin story. Cover vivid, spine tight.','Excellent','1970s',1,'#2F5D62'),
(4,5,'Abakada Reading Primer',350,'The primer an entire generation learned to read from. Light pencil marks on two pages.','Good','1960s',3,'#F26B1D'),
(4,5,'Tagalog Klasiks Bundle (5 issues)',980,'Five issues of a Tagalog klasiks title. Covers detached on one; all pages present.','Fair','1960s',1,'#7A3E2B'),
-- Advertising (Mang Ben + Lola''s Baul)
(1,6,'Enamel Tin Sign — Cola Brand',3800,'Double-sided enamel store sign, the kind nailed to sari-sari posts. Honest rust at the edges.','Fair','1960s',1,'#D9412B'),
(4,6,'Soft Drink Wall Calendar',1100,'Full twelve-month wall calendar from a soft drink brand, with painted Filipiniana illustrations.','Good','1978',1,'#E3A82B'),
(5,6,'Toothpaste Store Poster',720,'Rolled store poster for a local toothpaste brand. Never pinned.','Mint','1980s',2,'#2F5D62'),
(1,6,'Soda Bottle Wooden Crate',2400,'24-slot wooden delivery crate with stenciled bottler name. Sturdy, great as a shelf.','Good','1970s',1,'#7A3E2B'),
(5,6,'Soap Magazine Ad Print (Framed)',560,'Original magazine ad page, mounted and framed in narra.','Excellent','1960s',2,'#F26B1D');
