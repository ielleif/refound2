import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, fmtDate, peso } from '../api';
import { useApp } from '../context/AppContext';
import { Empty, Loading, ShipTracker, StatusPill } from '../components/Common';
import ProductArt from '../components/ProductArt';

const TABS = ['All', 'To Ship', 'To Receive', 'Completed', 'Cancelled'];
const inTab = (o, t) => t === 'All'
  || (t === 'To Ship' && ['Placed', 'Packed'].includes(o.status))
  || (t === 'To Receive' && ['Shipped', 'Out for Delivery'].includes(o.status))
  || (t === 'Completed' && o.status === 'Delivered')
  || (t === 'Cancelled' && o.status === 'Cancelled');

export function Orders() {
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState('All');

  useEffect(() => {
    const load = () => api.get('/orders').then(setOrders).catch(() => setOrders([]));
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  if (!orders) return <Loading />;
  const list = orders.filter(o => inTab(o, tab));

  return (
    <div className="container section">
      <span className="mono-label">Account</span>
      <h1 className="display">My Purchases</h1>
      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t} <span>{orders.filter(o => inTab(o, t)).length}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Empty title="No orders here" action={<Link to="/shop" className="btn">Find something</Link>} />
      ) : (
        <div className="order-list">
          {list.map(o => (
            <Link to={`/orders/${o.id}`} className="order-card" key={o.id}>
              <div className="order-card-head">
                <strong>{o.shop_name}</strong>
                <span className="mono-label">{o.order_no}</span>
                <StatusPill status={o.status} />
              </div>
              <div className="order-card-items">
                {o.items.map(i => (
                  <div className="order-line" key={i.id}>
                    <ProductArt category={i.category_slug} color={i.art_color} image={i.image_url} seed={i.product_id} />
                    <span>{i.name}<small> × {i.qty}</small></span>
                    <span>{peso(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="order-card-foot">
                <span className="muted small">{fmtDate(o.created_at)} · {o.payment_method}</span>
                <span>Total <strong className="price">{peso(o.total)}</strong></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const { toast } = useApp();
  const nav = useNavigate();
  const [o, setO] = useState(null);
  const [err, setErr] = useState('');

  const load = () => api.get(`/orders/${id}`).then(setO).catch(e => setErr(e.message));
  useEffect(() => {
    load();
    const t = setInterval(load, 8000); // watch the mock courier move
    return () => clearInterval(t);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err) return <div className="container section"><Empty title="Order not found">{err}</Empty></div>;
  if (!o) return <Loading />;

  const act = async (path, msg) => {
    try { await api.post(`/orders/${o.id}/${path}`); toast(msg); load(); } catch (e) { toast(e.message, 'err'); }
  };
  const chat = async () => {
    const c = await api.post('/chat/conversations', { shopId: o.shop_id });
    nav(`/messages/${c.id}`);
  };

  return (
    <div className="container section">
      <nav className="crumbs"><Link to="/orders">My Purchases</Link> / <span>{o.order_no}</span></nav>
      <div className="order-detail-head">
        <div>
          <span className="mono-label">Order no.</span>
          <h1 className="display display-sm">{o.order_no}</h1>
          <p className="muted">Placed {fmtDate(o.created_at)} · from <Link to={`/s/${o.shop_slug}`}>{o.shop_name}</Link></p>
        </div>
        <div className="order-actions">
          <button className="btn btn-ghost btn-sm" onClick={chat}>💬 Chat seller</button>
          {o.status === 'Placed' && <button className="btn btn-ghost btn-sm" onClick={() => window.confirm('Cancel this order?') && act('cancel', 'Order cancelled')}>Cancel order</button>}
          {['Shipped', 'Out for Delivery'].includes(o.status) && <button className="btn btn-sm" onClick={() => act('receive', 'Marked as received. Enjoy!')}>Order received</button>}
        </div>
      </div>

      <section className="step-card">
        <ShipTracker status={o.status} />
      </section>

      <div className="order-detail-grid">
        <section className="step-card">
          <h3>Shipment updates</h3>
          <ul className="timeline">
            {[...o.events].reverse().map(e => (
              <li key={e.id}>
                <time>{fmtDate(e.created_at)}</time>
                <strong>{e.status}</strong>
                <p>{e.note}</p>
              </li>
            ))}
          </ul>
        </section>
        <div>
          <section className="step-card">
            <h3>Delivery</h3>
            <dl className="spec">
              <div><dt>Recipient</dt><dd>{o.ship_name} · {o.ship_phone}</dd></div>
              <div><dt>Address</dt><dd>{o.ship_address}</dd></div>
              <div><dt>Courier</dt><dd>{o.courier}</dd></div>
              <div><dt>Tracking no.</dt><dd className="mono">{o.tracking_no || 'Assigned when shipped'}</dd></div>
            </dl>
          </section>
          <section className="step-card">
            <h3>Payment</h3>
            {o.items.map(i => (
              <div className="order-line" key={i.id}>
                <ProductArt category={i.category_slug} color={i.art_color} image={i.image_url} seed={i.product_id} />
                <Link to={`/product/${i.product_id}`}>{i.name}<small> × {i.qty}</small></Link>
                <span>{peso(i.price * i.qty)}</span>
              </div>
            ))}
            <div className="summary-row"><span>Subtotal</span><span>{peso(o.subtotal)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{peso(o.shipping_fee)}</span></div>
            <div className="summary-total"><span>Total</span><span>{peso(o.total)}</span></div>
            <div className="summary-row"><span>{o.payment_method}{o.payment_ref ? ` · ${o.payment_ref}` : ''}</span><StatusPill status={o.payment_status} /></div>
          </section>
        </div>
      </div>
    </div>
  );
}
