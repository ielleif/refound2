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
  avatar_url    VARCHAR(500) DEFAULT NULL,  -- profile picture
  cover_url     VARCHAR(500) DEFAULT NULL,  -- cover photo
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
  logo_url    VARCHAR(500) DEFAULT NULL,  -- shop profile picture
  cover_url   VARCHAR(500) DEFAULT NULL,  -- shop cover photo
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
(1,'toys','Toys & Action Figures','Die-cast super robots, superhero figures, toy guns and recess classics.'),
(2,'fastfood','Fast-Food Collectibles','Retired Jollibee mascots and kiddie meal toys from the 80s and 90s.'),
(3,'gadgets','Gadgets & Radios','Pagers, transistor radios, cassette players and virtual pets.'),
(4,'print','Komiks, Magazines & Posters','Golden-age komiks, movie magazines and theater posters.'),
(5,'currency','Coins, Stamps & Documents','Old pesos, revolutionary notes, stamps, cédulas and tickets.'),
(6,'heritage','Antiques & Heritage','Furniture, flat irons, brassware and heirlooms from old Filipino homes.');

INSERT INTO users (id, name, email, password_hash, phone, address) VALUES
(1,'Benjamin Cruz','ben@refound.ph','$2b$10$UJeQSDCIZTfjlrWA3WnXfeVvnGpCrAPNwyobA8Pc19/zydtsOPRQy','09171234567','Sta. Cruz, Manila'),
(2,'Carmela Reyes','mela@refound.ph','$2b$10$UJeQSDCIZTfjlrWA3WnXfeVvnGpCrAPNwyobA8Pc19/zydtsOPRQy','09181234567','Malolos, Bulacan'),
(3,'Paolo Santos','pao@refound.ph','$2b$10$UJeQSDCIZTfjlrWA3WnXfeVvnGpCrAPNwyobA8Pc19/zydtsOPRQy','09191234567','Cubao, Quezon City'),
(4,'Rosario Villanueva','rose@refound.ph','$2b$10$UJeQSDCIZTfjlrWA3WnXfeVvnGpCrAPNwyobA8Pc19/zydtsOPRQy','09201234567','Vigan, Ilocos Sur'),
(5,'Dennis Lim','dennis@refound.ph','$2b$10$UJeQSDCIZTfjlrWA3WnXfeVvnGpCrAPNwyobA8Pc19/zydtsOPRQy','09211234567','Cebu City'),
(6,'Juan Dela Cruz','juan@refound.ph','$2b$10$UJeQSDCIZTfjlrWA3WnXfeVvnGpCrAPNwyobA8Pc19/zydtsOPRQy','09991234567','123 Mabini St., Brgy. San Roque, Marikina City');

INSERT INTO shops (id, user_id, name, slug, tagline, description, location, color, is_demo) VALUES
(1,1,'Tindahan ni Mang Ben','tindahan-ni-mang-ben','Heirlooms from the old bahay na bato','Furniture, flat irons, brassware and family heirlooms from my father''s ancestral house in Sta. Cruz.','Manila','#D9412B',1),
(2,2,'Kahon ng Laruan','kahon-ng-laruan','Super robots & recess classics','Die-cast robots, superhero figures, toy guns and everything that used to live in a shoebox under the bed.','Bulacan','#E3A82B',1),
(3,3,'Pager & Pixels','pager-and-pixels','Tested. Cleaned. Still beeping.','Pagers, transistor radios, cassette players and virtual pets from the 60s to the 2000s.','Quezon City','#2F5D62',1),
(4,4,'Lola''s Baul','lolas-baul','Paper treasures from the old chest','Komiks, movie magazines, posters, coins, stamps and documents from my lola''s baul in Vigan.','Ilocos Sur','#1F3B2D',1),
(5,5,'Sari-Sari Archives','sari-sari-archives','Fast-food toys, kept since the 80s','Retired Jollibee mascots and kiddie meal toys, kept in their boxes for decades.','Cebu','#7A3E2B',1);

-- ---------- Products (photos live in client/public/products) ----------
INSERT INTO products (shop_id, category_id, name, price, description, condition_grade, era, stock, image_url, art_color) VALUES
(2,1,'Captain Barbell Action Figure (Sealed)',1850,'Mars Ravelo''s Captain Barbell in his yellow suit and red cape, still sealed in the original bag with stand and barbell accessory.','Sealed','1990s',1,'/products/captain-barbell-figure.jpg','#C8321F'),
(2,1,'Voltes V Die-Cast Super Robot',8500,'Heavy die-cast Voltes V with chrome details and the original chest emblem. The anime that ruled Filipino TV in the late 70s. Paint wear on the fists.','Good','1970s',1,'/products/voltes-v-die-cast.jpg','#F2661B'),
(2,1,'Mazinger Z Chogokin with Box',6800,'Bandai Eternal Hero Series reissue of the classic die-cast Mazinger Z, with red Jet Scrander wings and the illustrated box.','Excellent',NULL,1,'/products/mazinger-z-chogokin-boxed.jpg','#F4B532'),
(2,1,'Chrome Walking Robot Toy',900,'Battery-operated walking robot in shiny chrome with blue arms and a light-up chest. A tiangge favorite. Walks and lights up with fresh batteries.','Good','1990s',2,'/products/chrome-walking-robot.jpg','#E8452C'),
(2,1,'Rambo Toy Pistols (Set of 2)',1600,'Two Rambo-branded toy pistols with brown grips, one with a long barrel and one with a spare magazine. No bullets included.','Good','1980s',1,'/products/rambo-toy-pistols.jpg','#B4532A'),
(2,1,'Miniature Philippine Jeepney Toy with Box',3200,'Detailed die-cast jeepney with chrome horses, side mirrors and painted panels. Comes with its original box and owner''s manual.','Excellent','1980s',1,'/products/miniature-jeepney-boxed.jpg','#C8321F'),
(2,1,'Tarsan Teks Cards Bundle (60+ pcs)',380,'A thick stack of Tarsan teks game cards with comic panels on the back, held together like they were at recess.','Good','1980s',3,'/products/tarsan-teks-cards.jpg','#F2661B'),
(5,2,'Jollibee Jolly Band Figurine Set (8 pcs)',6500,'Eight Jolly Band musician figures on coloured bases, each with its own instrument. Shelf-displayed. The two large figures in the photo are not included.','Good','1980s',1,'/products/jolly-band-figure-set.jpg','#F4B532'),
(5,2,'Jollibee Jolly Band Drummer (Sealed)',1800,'Jollibee on the drums from the Jolly Band series, still sealed in its plastic. The drum reads "Jolly Band".','Sealed','1980s',1,'/products/jolly-band-jollibee-drummer.jpg','#E8452C'),
(5,2,'Champ Boxer Mascot Figure',1500,'The hamburger-headed boxer who promoted the Champ burger, in his robe, gloves and championship belt. He was retired in 2004.','Excellent',NULL,1,'/products/jollibee-champ-figure.jpg','#B4532A'),
(5,2,'Chickee Chicken Mascot Figure',850,'Vinyl figure of Chickee, the white hen introduced in 1983 to represent Chickenjoy, wearing her yellow necklace.','Good','1980s',1,'/products/jollibee-chickee-figure.jpg','#C8321F'),
(5,2,'Mico Milkshake Mascot Train Toy',950,'Mico, the boy with the milkshake-cup cap, riding a pink and blue train car. One of the mascots retired in the mid-1990s.','Good','1980s',1,'/products/jollibee-mico-train.jpg','#F2661B'),
(5,2,'Lady Moo Mascot Train Toy',950,'Lady Moo, the milkshake mascot, waving from her green train car with crates. Name plate still readable on the side.','Good','1980s',1,'/products/jollibee-lady-moo-train.jpg','#F4B532'),
(3,3,'USA Mobility Alphanumeric Pager',1200,'Black alphanumeric pager with a green backlit screen and scroll buttons. The beep that meant "call me back".','Good','2000s',2,'/products/usa-mobility-pager.jpg','#E8452C'),
(3,3,'Silver Portable Cassette Player-Recorder',2600,'Slim silver cassette player-recorder with piano-key buttons and a flip-up door. Plays and rewinds; new belt installed.','Good','1980s',1,'/products/portable-cassette-player.jpg','#B4532A'),
(3,3,'Standard All-Transistor Pocket Radio',1500,'Pocket-sized Standard all-transistor AM radio with a chrome speaker grille. Picks up local AM stations.','Good','1960s',1,'/products/standard-transistor-radio.jpg','#C8321F'),
(3,3,'Sunny Solid State Portable Radio',2200,'Wood-grain Sunny radio with a teal speaker panel and a starburst tuning dial. Carry handle intact.','Good','1970s',1,'/products/sunny-solid-state-radio.jpg','#F2661B'),
(3,3,'Retro-Style AM/FM Radio (Copper Finish)',1350,'A newer radio made to look vintage, with a copper body, chrome knobs and a built-in USB/TF player. Rechargeable.','Mint',NULL,3,'/products/retro-style-am-fm-radio.jpg','#F4B532'),
(3,3,'Tamagotchi Virtual Pet (Translucent Blue)',2200,'Egg-shaped Tamagotchi in clear blue with its keychain. Screen fully readable; new battery installed.','Excellent','1990s',1,'/products/tamagotchi-translucent-blue.jpg','#E8452C'),
(4,4,'Hiwaga Komiks Blg. 154 (August 22, 1956)',2200,'Ace Publications'' Hiwaga Komiks with a dancing-couple cover, priced at 25 sentimos. Spine wear, all pages present.','Fair','1956',1,'/products/hiwaga-komiks-154.jpg','#B4532A'),
(4,4,'Pantastik Komiks Blg. 5 (February 17, 1951)',2800,'Early issue of Pantastik Komiks featuring "Reynaldo" on the cover, for 25 sentimos. Cover worn at the edges.','Fair','1951',1,'/products/pantastik-komiks-5.jpg','#C8321F'),
(4,4,'Mars Ravelo''s Lastikman Komiks Magazine',650,'Lastikman stretching into action on the cover, from the issues priced at ₱7.50. Light creasing.','Good','1990s',2,'/products/lastikman-komiks.jpg','#F2661B'),
(4,4,'Ilang-Ilang Magazine – "Bertong Balutan" Cover (March 30, 1950)',2400,'Movie magazine cover promoting the film Bertong Balutan, with hand-painted art of the stars. Priced at 50 sentimos.','Fair','1950',1,'/products/ilang-ilang-magazine-1950.jpg','#F4B532'),
(4,4,'"Hanggang May Buhay" Movie Poster – Bong Revilla Jr. & Dawn Zulueta',1400,'Theater poster for the 1992 action film from Bonanza Films, directed by Pepe Marcos, starring Ramon "Bong" Revilla Jr. and Dawn Zulueta.','Good','1992',1,'/products/hanggang-may-buhay-poster.jpg','#E8452C'),
(4,5,'1903 Philippine One Peso Silver Coin',4800,'US–Philippine silver peso showing the Filipina with a hammer and anvil beside Mayon Volcano, with the US eagle on the reverse.','Good','1903',1,'/products/philippine-peso-1903.jpg','#B4532A'),
(4,5,'Spanish "Dos Mundos" Pillar Dollar (1744)',18500,'Silver columnaria (8 reales) showing two worlds between the Pillars of Hercules. It circulated in the Philippines during the galleon trade.','Good','1744',1,'/products/dos-mundos-pillar-dollar-1744.jpg','#C8321F'),
(4,5,'República Filipina One Peso Notes (Pair)',7500,'Two paper one-peso notes from the First Philippine Republic, printed with the names of Emilio Aguinaldo and Pedro Paterno.','Fair','1898',1,'/products/republica-filipina-peso-notes.jpg','#F2661B'),
(4,5,'1944 "VICTORY" Overprint 1-Peso Commonwealth Stamp',450,'Orange one-peso Commonwealth stamp overprinted VICTORY after liberation, showing a church scene. Unused with sharp perforations.','Mint','1944',2,'/products/victory-1-peso-stamp-1944.jpg','#F4B532'),
(4,5,'Philippine Islands 4-Centavo McKinley Stamp',250,'Red 4-centavo stamp of the US-administered Philippine Islands with a portrait of President McKinley.','Good','Early 1900s',3,'/products/mckinley-4-centavos-stamp.jpg','#E8452C'),
(4,5,'1920 Manila Cédula (Certificate of Registration)',3500,'Handwritten cédula personal from the Government of the Philippine Islands, paid at Manila for the calendar year 1920. Signed by the collector.','Fair','1920',1,'/products/cedula-1920-manila.jpg','#B4532A'),
(4,5,'Paper Bus Tickets Set (₱20, ₱30, ₱50)',150,'Three punch-style city bus tickets in blue, purple and green, from before tap cards replaced them.','Good','2010s',4,'/products/bus-tickets-set.jpg','#C8321F'),
(1,6,'Butaka Planter''s Lounge Chair',28000,'Hardwood butaka with a woven rattan seat and long extended armrests, the classic lounge chair of the bahay na bato. Pick-up or freight only.','Excellent','Pre-war',1,'/products/butaka-planters-chair.jpg','#F2661B'),
(1,6,'Charcoal Flat Iron (Plantsa de Uling)',1800,'Cast-iron box iron with a latched lid and vented sides, heated with live charcoal like lola used to. Wooden handle intact.','Good','Pre-war',2,'/products/charcoal-flat-iron.jpg','#F4B532'),
(1,6,'Antique Brass Pan Irons (Set of 2)',3200,'Two early pan-style irons with wooden handles, filled with embers to press clothes. Aged patina throughout.','Fair',NULL,1,'/products/brass-pan-irons.jpg','#E8452C'),
(1,6,'Maranao Brass Betel Nut Box (Lutuan)',9500,'Engraved Maranao brass box with silver-coloured inlay and ring handles, made to hold betel nut and leaves.','Excellent','Mid-1900s',1,'/products/maranao-betel-nut-box.jpg','#B4532A'),
(1,6,'Katipunan Sun Emblem Medal',2500,'Bronze-toned sun medal with a carved face and pointed rays, hung from a triangular tab, in the style of the Katipunan sun. Display piece.','For Display',NULL,1,'/products/katipunan-sun-medal.jpg','#C8321F'),
(1,6,'Vintage Pewter Lidded Jar',1600,'Heavy pewter jar with a ribbed neck and a screw-on cap, the kind kept for tea leaves or drinking water.','Good',NULL,1,'/products/pewter-lidded-jar.jpg','#F2661B'),
(1,6,'Champion Whisky Face-Shaped Bottle (Empty)',750,'Clear glass whisky bottle moulded with a carved face, with the Champion neck label still on. Empty, for display.','For Display',NULL,1,'/products/champion-whisky-face-bottle.jpg','#F4B532');

-- Each listing's photo also goes into the gallery table (sellers can add up to 7)
INSERT INTO product_images (product_id, url, sort_order) SELECT id, image_url, 0 FROM products;
