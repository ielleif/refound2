import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, peso } from '../api';
import { useApp } from '../context/AppContext';
import { Avatar, ProductCard, Loading, Empty } from '../components/Common';
import ProductArt from '../components/ProductArt';
import ImageCarousel from '../components/ImageCarousel';

export default function Product() {
  const { id } = useParams();
  const { user, shop, cart, addToCart, toast } = useApp();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setData(null); setQty(1);
    api.get(`/products/${id}`).then(setData).catch(e => setErr(e.message));
  }, [id]);

  if (err) return <div className="container section"><Empty title="Item not found">{err}</Empty></div>;
  if (!data) return <Loading />;
  const { product: p, related } = data;
  const own = shop && shop.id === p.shop_id;
  const soldOut = p.stock <= 0 || !p.is_active;
  const inCart = cart.find(c => c.product_id === p.id)?.qty || 0;
  const canAdd = Math.max(0, p.stock - inCart); // how many more can still go in the cart

  const needLogin = () => { nav(`/login?next=/product/${p.id}`); return true; };

  const add = async (buyNow = false) => {
    if (!user && needLogin()) return;
    setBusy(true);
    try {
      if (buyNow && canAdd === 0) { nav(`/checkout?items=${p.id}`); setBusy(false); return; }
      await addToCart(p.id, Math.min(qty, canAdd));
      setQty(1);
      if (buyNow) nav(`/checkout?items=${p.id}`);
      else toast(`Added “${p.name}” to cart`);
    } catch (e) { toast(e.message, 'err'); }
    setBusy(false);
  };

  const chat = async () => {
    if (!user && needLogin()) return;
    try {
      const c = await api.post('/chat/conversations', { shopId: p.shop_id, productId: p.id });
      nav(`/messages/${c.id}?product=${p.id}`);
    } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div className="container section">
      <nav className="crumbs">
        <Link to="/shop">Shop</Link> / <Link to={`/shop?category=${p.category_slug}`}>{p.category_name}</Link> / <span>{p.name}</span>
      </nav>
      <div className="product">
        <div className="product-gallery">
          {p.images?.length ? (
            <ImageCarousel images={p.images} alt={p.name} era={p.era} />
          ) : (
            <>
              <ProductArt category={p.category_slug} color={p.art_color} era={p.era} label={p.name} seed={p.id} className="art-lg" />
              <p className="mono-label art-note">Illustration · ask the seller for actual photos</p>
            </>
          )}
        </div>
        <div className="product-info">
          <span className="mono-label">{p.category_name} · Lot #{String(p.id).padStart(4, '0')}</span>
          <h1 className="product-title">{p.name}</h1>
          <div className="product-price">{peso(p.price)}</div>
          <dl className="spec">
            <div><dt>Era</dt><dd>{p.era || '—'}</dd></div>
            <div><dt>Condition</dt><dd>{p.condition_grade}</dd></div>
            <div><dt>Stock</dt><dd>{soldOut ? 'Sold out' : `${p.stock} left`}</dd></div>
            <div><dt>Ships from</dt><dd>{p.shop_location || 'Philippines'}</dd></div>
          </dl>
          <p className="product-desc">{p.description}</p>

          {own ? (
            <div className="notice">This is your listing. <Link to={`/seller/listings/${p.id}/edit`}>Edit in Seller Studio →</Link></div>
          ) : soldOut ? (
            <div className="notice notice-warn">This one has found a new home. <button className="link-btn" onClick={chat}>Ask the seller</button> if they have another.</div>
          ) : (
            <>
              <div className="qty-row">
                <span className="mono-label">Quantity</span>
                <div className="qty">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease">−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(canAdd, q + 1))} disabled={qty >= canAdd} aria-label="Increase">+</button>
                </div>
                <span className="qty-note">
                  {p.stock === 1 ? 'Only 1 piece — one of a kind' : `${p.stock} available`}
                  {inCart > 0 && ` · ${inCart} in your cart`}
                </span>
              </div>
              <div className="product-actions">
                {canAdd > 0
                  ? <button className="btn btn-lg btn-ghost" disabled={busy} onClick={() => add(false)}>Add to cart</button>
                  : <Link to="/cart" className="btn btn-lg btn-ghost">✓ In cart — view</Link>}
                <button className="btn btn-lg" disabled={busy} onClick={() => add(true)}>Buy now</button>
              </div>
            </>
          )}

          <div className="seller-box" style={{ '--c': p.shop_color }}>
            <Avatar src={p.shop_logo} name={p.shop_name} color={p.shop_color} square className="shop-chip-mark" />
            <div>
              <span className="mono-label">Sold by</span>
              <Link to={`/s/${p.shop_slug}`}><strong>{p.shop_name}</strong></Link>
              <small>{p.shop_location}</small>
            </div>
            {!own && <button className="btn btn-sm btn-ghost" onClick={chat}>💬 Chat seller</button>}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="display display-sm">You might also remember</h2></div>
          <div className="pgrid">{related.map(r => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
