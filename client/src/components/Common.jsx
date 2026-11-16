import { Link, Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { peso } from '../api';
import ProductArt from './ProductArt';

export function Logo({ light = false, size = '' }) {
  return (
    <Link to="/" className={`logo ${light ? 'logo-light' : ''} ${size}`} aria-label="re:found home">
      <span className="logo-re">re:</span>found
    </Link>
  );
}

export function ProductCard({ p }) {
  const soldOut = p.stock <= 0;
  return (
    <Link to={`/product/${p.id}`} className={`pcard ${soldOut ? 'is-soldout' : ''}`}>
      <div className="pcard-art">
        <ProductArt category={p.category_slug} color={p.art_color} image={p.image_url} label={p.name} seed={p.id} />
        {p.era && <span className="pcard-era">{p.era}</span>}
        <span className="pcard-cond">{p.condition_grade}</span>
        {soldOut && <span className="pcard-sold">Sold!</span>}
      </div>
      <div className="pcard-body">
        <span className="pcard-cat">{p.category_name}</span>
        <h3 className="pcard-name">{p.name}</h3>
        <div className="pcard-foot">
          <span className="price">{peso(p.price)}</span>
          <span className="pcard-go" aria-hidden>↗</span>
        </div>
        <span className="pcard-shop">{p.shop_name}</span>
      </div>
    </Link>
  );
}

export function RequireAuth({ children, shop: needShop }) {
  const { user, shop, ready } = useApp();
  const loc = useLocation();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (needShop && !shop) return <Navigate to="/sell" replace />;
  return children;
}

export function Loading({ label = 'Rummaging through the baul…' }) {
  return <div className="loading"><span className="spinner" />{label}</div>;
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-stamp">Wala pa!</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function StatusPill({ status }) {
  const cls = {
    Placed: 'pill-mustard', Packed: 'pill-orange', Shipped: 'pill-teal',
    'Out for Delivery': 'pill-teal', Delivered: 'pill-forest', Cancelled: 'pill-muted',
    Paid: 'pill-forest', Pending: 'pill-mustard', Refunded: 'pill-muted',
  }[status] || '';
  return <span className={`pill ${cls}`}>{status}</span>;
}

export const SHIP_FLOW = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

export function ShipTracker({ status }) {
  const idx = SHIP_FLOW.indexOf(status);
  if (status === 'Cancelled') return <div className="tracker tracker-cancel">This order was cancelled.</div>;
  return (
    <ol className="tracker">
      {SHIP_FLOW.map((s, i) => (
        <li key={s} className={i <= idx ? 'done' : ''}>
          <span className="tracker-dot">{i < idx ? '✓' : i + 1}</span>
          <span className="tracker-label">{s}</span>
        </li>
      ))}
    </ol>
  );
}
