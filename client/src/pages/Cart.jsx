import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, peso } from '../api';
import { useApp } from '../context/AppContext';
import { Empty } from '../components/Common';
import ProductArt from '../components/ProductArt';

export default function Cart() {
  const { cart, setCart, refreshCart, toast } = useApp();
  const nav = useNavigate();
  // Track what the buyer unticked; everything available is selected by default.
  const [unticked, setUnticked] = useState(() => new Set());

  useEffect(() => { refreshCart(); }, [refreshCart]);
  const selected = new Set(cart.filter(c => c.stock > 0 && c.is_active && !unticked.has(c.product_id)).map(c => c.product_id));

  const groups = useMemo(() => {
    const g = {};
    cart.forEach(i => (g[i.shop_id] ||= { name: i.shop_name, slug: i.shop_slug, items: [] }).items.push(i));
    return Object.values(g);
  }, [cart]);

  const chosen = cart.filter(i => selected.has(i.product_id));
  const subtotal = chosen.reduce((s, i) => s + i.price * i.qty, 0);

  const toggle = id => setUnticked(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const setQty = async (id, qty) => { try { setCart(await api.put(`/cart/${id}`, { qty })); } catch (e) { toast(e.message, 'err'); } };
  const remove = async id => { setCart(await api.del(`/cart/${id}`)); toast('Removed from cart'); };

  if (!cart.length) return (
    <div className="container section">
      <Empty title="Your cart is empty" action={<Link to="/shop" className="btn">Start browsing</Link>}>
        Somewhere out there is a tex card with your name on it.
      </Empty>
    </div>
  );

  return (
    <div className="container section">
      <h1 className="display">Your Cart</h1>
      <div className="cart-layout">
        <div className="cart-groups">
          {groups.map(g => (
            <div className="cart-group" key={g.slug}>
              <div className="cart-group-head">
                <span className="mono-label">Shop</span>
                <Link to={`/s/${g.slug}`}><strong>{g.name}</strong></Link>
              </div>
              {g.items.map(i => {
                const unavailable = !i.is_active || i.stock <= 0;
                return (
                  <div className={`cart-item ${unavailable ? 'is-unavail' : ''}`} key={i.product_id}>
                    <input type="checkbox" aria-label={`Select ${i.name}`} disabled={unavailable}
                      checked={selected.has(i.product_id)} onChange={() => toggle(i.product_id)} />
                    <Link to={`/product/${i.product_id}`} className="cart-thumb">
                      <ProductArt category={i.category_slug} color={i.art_color} image={i.image_url} seed={i.product_id} />
                    </Link>
                    <div className="cart-item-info">
                      <Link to={`/product/${i.product_id}`}><strong>{i.name}</strong></Link>
                      <small>{i.condition_grade} · {i.era}</small>
                      {unavailable && <small className="text-red">No longer available</small>}
                    </div>
                    <div className="qty qty-sm">
                      <button onClick={() => setQty(i.product_id, i.qty - 1)} disabled={i.qty <= 1}>−</button>
                      <span>{i.qty}</span>
                      <button onClick={() => setQty(i.product_id, i.qty + 1)} disabled={i.qty >= i.stock}>+</button>
                    </div>
                    <span className="price">{peso(i.price * i.qty)}</span>
                    <button className="icon-x" onClick={() => remove(i.product_id)} aria-label="Remove">×</button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <aside className="summary">
          <h3>Order Summary</h3>
          <div className="summary-row"><span>Items selected</span><span>{chosen.reduce((s, i) => s + i.qty, 0)}</span></div>
          <div className="summary-row"><span>Subtotal</span><span>{peso(subtotal)}</span></div>
          <div className="summary-row muted"><span>Shipping</span><span>Calculated at checkout</span></div>
          <div className="summary-total"><span>Total</span><span>{peso(subtotal)}</span></div>
          <button className="btn btn-lg btn-block" disabled={!chosen.length}
            onClick={() => nav(`/checkout?items=${chosen.map(i => i.product_id).join(',')}`)}>
            Checkout ({chosen.length})
          </button>
          <Link to="/shop" className="link-btn">← Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
