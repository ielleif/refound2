import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, peso } from '../api';
import { useApp } from '../context/AppContext';
import { Loading, Empty } from '../components/Common';
import ProductArt from '../components/ProductArt';

const METHODS = [
  { id: 'GCash', label: 'GCash', note: 'Pay with your e-wallet', color: '#1F6FE5' },
  { id: 'Maya', label: 'Maya', note: 'Pay with your e-wallet', color: '#1E1B18' },
  { id: 'Card', label: 'Credit / Debit Card', note: 'Visa · Mastercard · JCB', color: '#7A3E2B' },
  { id: 'COD', label: 'Cash on Delivery', note: 'Pay the rider when it arrives', color: '#2F5D62' },
];

export default function Checkout() {
  const { user, cart, refreshCart, toast } = useApp();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [couriers, setCouriers] = useState(null);
  const [ship, setShip] = useState({ ship_name: user.name, ship_phone: user.phone || '', ship_address: user.address || '' });
  const [courier, setCourier] = useState('J&T Express');
  const [method, setMethod] = useState('GCash');
  const [card, setCard] = useState({ number: '', name: '', exp: '', cvc: '' });
  const [modal, setModal] = useState(null); // null | 'wallet' | 'otp' | 'processing'
  const [wallet, setWallet] = useState({ phone: user.phone || '', pin: '' });
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => { api.get('/couriers').then(setCouriers); refreshCart(); }, [refreshCart]);

  const ids = (params.get('items') || '').split(',').filter(Boolean).map(Number);
  const items = cart.filter(i => (ids.length ? ids.includes(i.product_id) : true) && i.stock > 0 && i.is_active);
  const groups = useMemo(() => {
    const g = {};
    items.forEach(i => (g[i.shop_id] ||= { name: i.shop_name, items: [] }).items.push(i));
    return Object.values(g);
  }, [items]);

  if (done) return <Success orders={done.orders} method={done.method} />;
  if (!couriers) return <Loading />;
  if (!items.length) return (
    <div className="container section">
      <Empty title="Nothing to check out" action={<Link to="/cart" className="btn">Back to cart</Link>} />
    </div>
  );

  const fee = couriers[courier] || 0;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingTotal = fee * groups.length;
  const total = subtotal + shippingTotal;

  const validate = () => {
    if (!ship.ship_name.trim() || !ship.ship_address.trim()) return 'Please complete your shipping address.';
    if (!/^(09|\+639)\d{9}$/.test(ship.ship_phone.replace(/[\s-]/g, ''))) return 'Enter a valid PH mobile number (e.g. 0917 123 4567).';
    if (method === 'Card') {
      if (card.number.replace(/\s/g, '').length < 15) return 'Enter a valid card number.';
      if (!/^\d{2}\/\d{2}$/.test(card.exp)) return 'Card expiry must be MM/YY.';
      if (!/^\d{3,4}$/.test(card.cvc)) return 'Enter the 3-digit CVC.';
      if (!card.name.trim()) return 'Enter the cardholder name.';
    }
    return '';
  };

  const start = () => {
    const v = validate();
    setErr(v);
    if (v) return window.scrollTo({ top: 0, behavior: 'smooth' });
    if (method === 'GCash' || method === 'Maya') setModal('wallet');
    else if (method === 'Card') setModal('otp');
    else place();
  };

  const place = async () => {
    setModal('processing');
    await new Promise(r => setTimeout(r, 1400)); // pretend we're talking to the payment gateway
    try {
      const r = await api.post('/checkout', { ...ship, courier, payment_method: method, productIds: items.map(i => i.product_id) });
      setModal(null);
      setDone({ orders: r.orders, method });
      refreshCart();
    } catch (e) {
      setModal(null);
      setErr(e.message);
      toast(e.message, 'err');
    }
  };

  const fmtCard = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = v => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  return (
    <div className="container section">
      <nav className="crumbs"><Link to="/cart">Cart</Link> / <span>Checkout</span></nav>
      <h1 className="display">Checkout</h1>
      {err && <div className="form-error">{err}</div>}
      <div className="checkout-layout">
        <div className="checkout-steps">
          <section className="step-card">
            <h3><span className="step-n">1</span> Shipping address</h3>
            <div className="form">
              <div className="form-row">
                <label>Recipient name<input value={ship.ship_name} onChange={e => setShip({ ...ship, ship_name: e.target.value })} /></label>
                <label>Mobile number<input value={ship.ship_phone} placeholder="0917 123 4567" onChange={e => setShip({ ...ship, ship_phone: e.target.value })} /></label>
              </div>
              <label>Complete address<textarea rows="2" value={ship.ship_address} placeholder="House no., street, barangay, city, province"
                onChange={e => setShip({ ...ship, ship_address: e.target.value })} /></label>
            </div>
          </section>

          <section className="step-card">
            <h3><span className="step-n">2</span> Courier</h3>
            <div className="radio-grid">
              {Object.entries(couriers).map(([name, price]) => (
                <label key={name} className={`radio-card ${courier === name ? 'active' : ''}`}>
                  <input type="radio" name="courier" checked={courier === name} onChange={() => setCourier(name)} />
                  <strong>{name}</strong>
                  <small>{name.includes('Same-day') ? 'Metro Manila, same day' : '3–7 business days'}</small>
                  <span className="price">{peso(price)}<small> / parcel</small></span>
                </label>
              ))}
            </div>
            {groups.length > 1 && <p className="muted small">Your items come from {groups.length} shops, so they ship as {groups.length} separate parcels.</p>}
          </section>

          <section className="step-card">
            <h3><span className="step-n">3</span> Payment</h3>
            <div className="radio-grid">
              {METHODS.map(m => (
                <label key={m.id} className={`radio-card ${method === m.id ? 'active' : ''}`}>
                  <input type="radio" name="pay" checked={method === m.id} onChange={() => setMethod(m.id)} />
                  <span className="pay-mark" style={{ background: m.color }}>{m.id === 'COD' ? '₱' : m.id[0]}</span>
                  <strong>{m.label}</strong>
                  <small>{m.note}</small>
                </label>
              ))}
            </div>
            {method === 'Card' && (
              <div className="form card-form">
                <label>Card number<input inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.number} onChange={e => setCard({ ...card, number: fmtCard(e.target.value) })} /></label>
                <div className="form-row form-row-3">
                  <label>Name on card<input value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} /></label>
                  <label>Expiry<input placeholder="MM/YY" value={card.exp} onChange={e => setCard({ ...card, exp: fmtExp(e.target.value) })} /></label>
                  <label>CVC<input inputMode="numeric" placeholder="123" value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></label>
                </div>
                <p className="mono-label">Mock only — use any test number like 4242 4242 4242 4242</p>
              </div>
            )}
          </section>
        </div>

        <aside className="summary">
          <h3>Order Summary</h3>
          {groups.map(g => (
            <div className="summary-group" key={g.name}>
              <span className="mono-label">{g.name}</span>
              {g.items.map(i => (
                <div className="summary-item" key={i.product_id}>
                  <ProductArt category={i.category_slug} color={i.art_color} image={i.image_url} seed={i.product_id} />
                  <span>{i.name}<small> × {i.qty}</small></span>
                  <span>{peso(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="summary-row"><span>Subtotal</span><span>{peso(subtotal)}</span></div>
          <div className="summary-row"><span>Shipping ({groups.length} parcel{groups.length > 1 ? 's' : ''})</span><span>{peso(shippingTotal)}</span></div>
          <div className="summary-total"><span>Total</span><span>{peso(total)}</span></div>
          <button className="btn btn-lg btn-block" onClick={start}>
            {method === 'COD' ? 'Place order' : `Pay ${peso(total)}`}
          </button>
          <p className="mono-label center">No real payment will be made</p>
        </aside>
      </div>

      {modal && (
        <div className="modal-back">
          <div className="modal">
            {modal === 'wallet' && (
              <form onSubmit={e => { e.preventDefault(); if (wallet.pin.length === 4 || wallet.pin.length === 6) place(); }}>
                <div className="wallet-head" style={{ background: method === 'GCash' ? '#1F6FE5' : '#1E1B18' }}>
                  <strong>{method}</strong><span>Mock checkout</span>
                </div>
                <div className="form modal-body">
                  <p>Pay <strong>{peso(total)}</strong> to <strong>RE:FOUND PH</strong></p>
                  <label>Mobile number<input value={wallet.phone} onChange={e => setWallet({ ...wallet, phone: e.target.value })} placeholder="0917 123 4567" required /></label>
                  <label>MPIN<input type="password" inputMode="numeric" maxLength={6} value={wallet.pin} placeholder="any 4–6 digits"
                    onChange={e => setWallet({ ...wallet, pin: e.target.value.replace(/\D/g, '') })} required /></label>
                  <button className="btn btn-block" disabled={!(wallet.pin.length === 4 || wallet.pin.length === 6)}>Authorize payment</button>
                  <button type="button" className="link-btn" onClick={() => setModal(null)}>Cancel</button>
                </div>
              </form>
            )}
            {modal === 'otp' && (
              <form onSubmit={e => { e.preventDefault(); if (otp.length === 6) place(); }}>
                <div className="wallet-head" style={{ background: '#7A3E2B' }}><strong>3-D Secure</strong><span>Card verification</span></div>
                <div className="form modal-body">
                  <p>We sent a one-time PIN to the number on file for card ending <strong>{card.number.slice(-4)}</strong>.</p>
                  <label>One-time PIN<input inputMode="numeric" maxLength={6} value={otp} placeholder="Enter any 6 digits" onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} /></label>
                  <button className="btn btn-block" disabled={otp.length !== 6}>Verify &amp; pay {peso(total)}</button>
                  <button type="button" className="link-btn" onClick={() => setModal(null)}>Cancel</button>
                </div>
              </form>
            )}
            {modal === 'processing' && (
              <div className="modal-body center processing">
                <span className="spinner spinner-lg" />
                <h3>{method === 'COD' ? 'Placing your order…' : 'Processing payment…'}</h3>
                <p className="muted">Please don't close this window.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  function Success({ orders, method }) {
    return (
      <div className="container section">
        <div className="success">
          <div className="stamp stamp-ok">Order<br />Placed<small>Salamat!</small></div>
          <h1 className="display">Your finds are on the way home.</h1>
          <p className="muted">{method === 'COD' ? 'Please prepare the exact amount for the rider.' : `Payment via ${method} confirmed.`}</p>
          <div className="success-orders">
            {orders.map(o => (
              <Link to={`/orders/${o.id}`} key={o.id} className="success-order">
                <span className="mono-label">Order no.</span>
                <strong>{o.order_no}</strong>
                {o.payment_ref && <small>Ref: {o.payment_ref}</small>}
                <span className="price">{peso(o.total)}</span>
                <span className="link-arrow">Track →</span>
              </Link>
            ))}
          </div>
          <div className="hero-cta center">
            <button className="btn" onClick={() => nav('/orders')}>View my purchases</button>
            <Link to="/shop" className="btn btn-ghost">Keep browsing</Link>
          </div>
        </div>
      </div>
    );
  }
}
