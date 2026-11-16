import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { ProductCard, Loading } from '../components/Common';
import { Blob, Bolt, DashArrow, Heart, Polaroid, Pop, Squiggle, Star, Sticker, Tag } from '../components/Deco';

export default function Home() {
  const { shop } = useApp();
  const [cats, setCats] = useState([]);
  const [active, setActive] = useState('toys');
  const [items, setItems] = useState(null);
  const [hero, setHero] = useState([]);
  const [shops, setShops] = useState([]);
  const [down, setDown] = useState('');

  useEffect(() => {
    const fail = e => setDown(e.message);
    api.get('/categories').then(setCats).catch(fail);
    api.get('/shops').then(setShops).catch(fail);
    api.get('/products?limit=12&sort=newest').then(list => setHero(list.filter(p => p.stock > 0))).catch(fail);
  }, []);
  useEffect(() => {
    setItems(null);
    api.get(`/products?category=${active}&limit=4`).then(setItems).catch(() => setItems([]));
  }, [active]);

  // Illustrated stand-ins so the collage never looks empty while data loads
  const PLACEHOLDERS = [
    { category_slug: 'snacks', art_color: '#F2661B', name: 'Sari-sari classics' },
    { category_slug: 'gadgets', art_color: '#C8321F', id: 0, name: 'Beep beep era' },
    { category_slug: 'print', art_color: '#F4B532', name: 'Komiks corner' },
    { category_slug: 'toys', art_color: '#E8452C', name: 'Recess toys' },
    { category_slug: 'ads', art_color: '#B4532A', name: 'Tin signs' },
    { category_slug: 'merch', art_color: '#F2661B', name: 'Promo merch' },
  ];
  const pick = i => (hero.length ? hero[i % hero.length] : PLACEHOLDERS[i % PLACEHOLDERS.length]);
  const activeCat = cats.find(c => c.slug === active);

  return (
    <>
      {down && (
        <div className="api-down" role="alert">
          <strong>Can't load the shop right now.</strong> {down} Start it with <code>npm start</code> inside <code>refound2\server</code>, then refresh.
        </div>
      )}

      {/* ---------- HERO ---------- */}
      <section className="hero halftone-corners">
        <div className="container hero-inner">
          <div className="hero-blob">
            <Blob />
            <DashArrow className="hero-dash" />
            <Heart className="hero-heart" />
            <Sticker color="red" tilt={8} className="hero-st1">Sari-sari</Sticker>
            <Sticker color="pink" tilt={-12} className="hero-st2">Recess Vibes</Sticker>
            <div className="hero-copy">
              <h1 className="hero-title">
                <span className="hero-find">Find your</span>
                <Pop tone="orange" as="span" className="hero-word1">PINOY</Pop>
                <Pop tone="mustard" as="span" className="hero-word2">NOSTALGIA</Pop>
                <span className="hero-here">here.</span>
              </h1>
              <p className="hero-sub">The marketplace for Filipino things they stopped making: kiddie meal toys, sari-sari wrappers, pagers, komiks and lolo's tin signs.</p>
              <div className="hero-cta">
                <Link to="/shop" className="btn btn-lg">Show all finds <span aria-hidden>↗</span></Link>
                <Link to={shop ? '/seller' : '/sell'} className="btn btn-lg btn-cream">{shop ? 'Seller Studio' : 'Sell yours'}</Link>
              </div>
            </div>
          </div>
          <Bolt className="hero-bolt" />
          <Star className="hero-star" />
          <Polaroid product={pick(0)} tilt={-9} className="hero-pol1" />
          <Polaroid product={pick(3)} tilt={7} className="hero-pol2" />
        </div>
      </section>

      {/* ---------- ABOUT ---------- */}
      <section className="about">
        <Squiggle className="about-squiggle" />
        <Tag>About vintage</Tag>
        <p className="about-text">
          <strong>Discontinued doesn't mean forgotten.</strong>{' '}
          <span>Every item here once sat on a sari-sari shelf, in a lunchbox, or under a bed. We help collectors</span>{' '}
          <strong>find them again</strong>{' '}
          <span>and help keepers give them a second home.</span>
        </p>
        <Link to="/sellers" className="btn btn-cream btn-sm about-btn" aria-label="Meet the sellers">Meet the keepers ↗</Link>
      </section>

      {/* ---------- STATIC TAPE + PERKS ---------- */}
      <section className="container perks-wrap">
        <div className="tape" aria-label="What's new">
          <span>New arrival</span><b>●</b><span>Fresh from the baul</span><b>▲</b><span>Rare finds</span><b>●</b><span>Just listed</span>
        </div>
        <div className="perks">
          <div className="perk"><span className="perk-ico">₱</span><div><strong>GCash · Maya · Card · COD</strong><small>Pay the way you like (mock checkout)</small></div></div>
          <div className="perk perk-tilt"><span className="perk-ico">💬</span><div><strong>Chat every seller</strong><small>Ask for more photos before you buy</small></div></div>
          <div className="perk"><span className="perk-ico">📦</span><div><strong>Ships nationwide</strong><small>J&amp;T, LBC, Ninja Van and same-day</small></div></div>
        </div>
      </section>

      {/* ---------- COLLECTIONS ---------- */}
      <section className="container section collections">
        <div className="center-head">
          <Tag>Collections</Tag>
          <h2 className="display">Pick a decade-defining shelf</h2>
        </div>
        <div className="cat-tabs" role="tablist">
          {cats.map(c => (
            <button key={c.slug} role="tab" aria-selected={active === c.slug}
              className={active === c.slug ? 'active' : ''} onClick={() => setActive(c.slug)}>
              {c.name}<small>{c.product_count}</small>
            </button>
          ))}
        </div>
        {activeCat && <p className="cat-blurb">{activeCat.blurb}</p>}
        {items === null ? <Loading /> : items.length === 0 ? (
          <p className="cat-blurb">{down ? 'Products will appear here once the server is running.' : 'Nothing on this shelf yet.'}</p>
        ) : (
          <div className="pgrid">{items.map(p => <ProductCard key={p.id} p={p} />)}</div>
        )}
        <div className="center-cta">
          <Link to={`/shop?category=${active}`} className="btn btn-cream">Show all {activeCat?.name || 'finds'} ↗</Link>
        </div>
      </section>

      {/* ---------- LOOKBOOK ---------- */}
      <section className="lookbook" id="lookbook">
        <div className="container lookbook-inner">
          <div className="lookbook-photos">
            <Polaroid product={pick(5)} tilt={-6} gray caption={false} className="lb-p1" />
            <Polaroid product={pick(1)} tilt={5} gray caption={false} className="lb-p2" />
            <Sticker color="cream" tilt={-6} className="lb-st">Since 1978</Sticker>
          </div>
          <div className="lookbook-copy">
            <Tag>Top lookbook</Tag>
            <h2 className="marker">#Throwback90s</h2>
            <blockquote>“Unbox the decade you grew up in. Pagers that still beep, komiks that still smell like Sunday, and the kiddie meal toys you begged for.”</blockquote>
            <Link to="/shop?sort=oldest" className="btn btn-cream">Shop by era ↗</Link>
          </div>
        </div>
      </section>

      {/* ---------- SELLERS ---------- */}
      {shops.length > 0 && <section className="container section">
        <div className="center-head">
          <Tag>The keepers</Tag>
          <h2 className="display">Shops worth rummaging</h2>
        </div>
        <div className="shop-strip">
          {shops.slice(0, 5).map((s, i) => (
            <Link to={`/s/${s.slug}`} key={s.id} className="shop-chip" style={{ '--c': s.color, '--tilt': `${[-3, 2, -1.5, 3, -2][i % 5]}deg` }}>
              <span className="shop-chip-mark">{s.name[0]}</span>
              <strong>{s.name}</strong>
              <small>{s.tagline || s.location}</small>
              <span className="shop-chip-count">{s.product_count} listings ↗</span>
            </Link>
          ))}
        </div>
      </section>}

      {/* ---------- SELL CTA ---------- */}
      <section className="container section">
        <div className="sell-cta">
          <div className="sell-cta-copy">
            <Tag>For collectors &amp; keepers</Tag>
            <h2 className="sell-cta-title">Got a shoebox full of memories?</h2>
            <p className="sell-cta-marker">Give them a second home.</p>
            <ul className="sell-cta-points">
              <li><b>₱0</b> to open a shop</li>
              <li><b>Instant</b> approval</li>
              <li><b>Same account</b>, no logging out</li>
            </ul>
            <Link to={shop ? '/seller' : '/sell'} className="btn btn-lg btn-cream">{shop ? 'Go to Seller Studio' : 'Open my shop'} ↗</Link>
          </div>
          <div className="sell-cta-art" aria-hidden>
            <Polaroid product={pick(2)} tilt={-7} className="cta-pol1" />
            <Polaroid product={pick(4)} tilt={6} className="cta-pol2" />
            <Sticker color="mustard" tilt={-10} className="cta-st">Sell it!</Sticker>
            <Bolt className="cta-bolt" />
          </div>
        </div>
      </section>
    </>
  );
}
