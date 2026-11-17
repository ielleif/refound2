import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { Bolt, Heart, Polaroid, Pop, Squiggle, Star, Sticker, Tag } from '../components/Deco';

const ERAS = [
  { era: '1900s', title: 'Pesos & cédulas', text: 'US–Philippine silver pesos, McKinley stamps and a 1920 Manila cédula.', cat: 'currency', color: '#B4532A' },
  { era: '50s', title: 'Komiks golden age', text: 'Hiwaga and Pantastik Komiks, plus Ilang-Ilang movie magazines.', cat: 'print', color: '#C8321F' },
  { era: '70s', title: 'Super robots', text: 'Die-cast Voltes V and Mazinger Z, the heroes of afternoon TV.', cat: 'toys', color: '#F2661B' },
  { era: '80s', title: 'Jollibee mascots', text: 'The Jolly Band, Chickee, Lady Moo, Mico and Champ.', cat: 'fastfood', color: '#F4B532' },
  { era: '90s', title: 'Beepers & virtual pets', text: 'Pagers, Tamagotchi and pocket radios that still work.', cat: 'gadgets', color: '#E8452C' },
];

export default function About() {
  const { shop } = useApp();
  const [stats, setStats] = useState(null);
  const [cats, setCats] = useState([]);
  useEffect(() => {
    api.get('/stats').then(setStats).catch(() => {});
    api.get('/categories').then(setCats).catch(() => {});
  }, []);

  return (
    <>
      <section className="page-hero halftone-corners">
        <div className="container page-hero-inner">
          <Tag>About re:found</Tag>
          <h1 className="page-hero-title">
            <span className="hero-find">We keep</span>
            <Pop tone="orange">MEMORIES</Pop>
            <span className="page-hero-sub">from going out of print.</span>
          </h1>
          <Star className="ph-star" />
          <Heart className="ph-heart" />
          <Sticker color="red" tilt={8} className="ph-st">Since 2026</Sticker>
        </div>
      </section>

      <section className="container section about-story">
        <div className="about-story-copy">
          <Tag>Our story</Tag>
          <h2 className="display">It started with a shoebox under lola's bed.</h2>
          <p>Inside were teks cards, a sealed Jollibee Jolly Band toy, a Hiwaga Komiks from 1956 and lolo's 1920 cédula. Every family has a box like that. Most of them end up in the trash.</p>
          <p><strong>re:found</strong> is a marketplace where those things find a second home. Collectors hunt for the exact toy they had in grade school, and keepers (the people who held on to them) can finally pass them on to someone who cares.</p>
          <p className="about-note">This is a mock e-commerce project: shopping, payments and shipping are all simulated.</p>
        </div>
        <div className="about-story-art" aria-hidden>
          <Polaroid product={{ category_slug: 'print', image_url: '/products/hiwaga-komiks-154.jpg' }} tilt={-7} caption="Hiwaga Komiks, 1956" className="as-p1" />
          <Polaroid product={{ category_slug: 'fastfood', image_url: '/products/jolly-band-jollibee-drummer.jpg' }} tilt={6} caption="Jolly Band drummer" className="as-p2" />
          <Squiggle className="as-sq" color="#C8321F" />
        </div>
      </section>

      {stats && (
        <section className="container stats-band">
          <div><strong>{stats.products}</strong><span>finds listed</span></div>
          <div><strong>{stats.shops}</strong><span>independent keepers</span></div>
          <div><strong>{stats.members}</strong><span>members</span></div>
          <div><strong>{cats.length || 6}</strong><span>collections</span></div>
        </section>
      )}

      <section className="container section">
        <div className="center-head">
          <Tag>Through the decades</Tag>
          <h2 className="display">What we bring back</h2>
        </div>
        <div className="eras">
          {ERAS.map((e, i) => (
            <Link to={`/shop?category=${e.cat}`} key={e.era} className="era-card" style={{ '--c': e.color, '--tilt': `${[-2, 1.5, -1, 2, -1.5][i]}deg` }}>
              <span className="era-num">{e.era}</span>
              <h3>{e.title}</h3>
              <p>{e.text}</p>
              <span className="era-go">Browse ↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="how">
        <div className="container">
          <div className="center-head">
            <Tag>How it works</Tag>
            <h2 className="display">Three steps to found again</h2>
          </div>
          <ol className="how-steps">
            <li><span>1</span><h3>Find it</h3><p>Search by name or decade, or browse a collection. Every listing shows its condition and era.</p></li>
            <li><span>2</span><h3>Chat the keeper</h3><p>Ask for more photos or details before you buy. Every seller has an inbox.</p></li>
            <li><span>3</span><h3>Check out &amp; track</h3><p>Pay by GCash, Maya, card or COD (all mock), then follow your parcel step by step.</p></li>
          </ol>
        </div>
      </section>

      <section className="container section">
        <div className="center-head">
          <Tag>What we stand for</Tag>
          <h2 className="display">House rules</h2>
        </div>
        <div className="values">
          <div className="value"><span className="value-ico">✓</span><h3>Honest condition</h3><p>Sealed, mint, good or for display only: sellers say exactly what you're getting, flaws included.</p></div>
          <div className="value value-red"><span className="value-ico">♥</span><h3>Local keepers</h3><p>Every shop is a person with a story, from sari-sari owners to komiks collectors.</p></div>
          <div className="value"><span className="value-ico">★</span><h3>Open to everyone</h3><p>Anyone can open a shop on their own account, with instant approval and no fees.</p></div>
        </div>
      </section>

      <section className="container section">
        <div className="about-cta">
          <Bolt className="about-cta-bolt" />
          <div>
            <h2 className="display">Got questions, or a box of treasures?</h2>
            <p>We'd love to hear from you, whether you're hunting for something or ready to sell.</p>
          </div>
          <div className="about-cta-btns">
            <Link to="/contact" className="btn btn-lg">Contact us ↗</Link>
            <Link to={shop ? '/seller' : '/sell'} className="btn btn-lg btn-cream">{shop ? 'Seller Studio' : 'Open a shop'}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
