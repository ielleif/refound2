import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmtDate, peso } from '../../api';
import { useApp } from '../../context/AppContext';
import { Empty, Loading, ShipTracker, StatusPill, SHIP_FLOW } from '../../components/Common';
import ProductArt from '../../components/ProductArt';

const NEXT_LABEL = {
  Placed: 'Mark as packed',
  Packed: 'Hand to courier (ship)',
  Shipped: 'Mark out for delivery',
  'Out for Delivery': 'Mark as delivered',
};
const TABS = ['All', 'To Ship', 'Shipping', 'Completed', 'Cancelled'];
const inTab = (o, t) => t === 'All'
  || (t === 'To Ship' && ['Placed', 'Packed'].includes(o.status))
  || (t === 'Shipping' && ['Shipped', 'Out for Delivery'].includes(o.status))
  || (t === 'Completed' && o.status === 'Delivered')
  || (t === 'Cancelled' && o.status === 'Cancelled');

export default function SellerOrders() {
  const { toast } = useApp();
  const nav = useNavigate();
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState('To Ship');
  const [open, setOpen] = useState(null);

  const load = () => api.get('/seller/orders').then(setOrders);
  useEffect(() => { load(); }, []);

  const advance = async o => {
    try { const r = await api.post(`/seller/orders/${o.id}/advance`); toast(`Order is now “${r.status}”`); load(); }
    catch (e) { toast(e.message, 'err'); }
  };
  const cancel = async o => {
    if (!window.confirm('Cancel this order? Stock will be restored and paid orders refunded.')) return;
    try { await api.post(`/seller/orders/${o.id}/cancel`); toast('Order cancelled'); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  if (!orders) return <Loading />;
  const list = orders.filter(o => inTab(o, tab));

  return (
    <>
      <div className="studio-head">
        <div>
          <span className="mono-label">Orders</span>
          <h1 className="display display-sm">Orders received</h1>
        </div>
      </div>
      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t} <span>{orders.filter(o => inTab(o, t)).length}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? <Empty title="No orders in this tab" /> : (
        <div className="order-list">
          {list.map(o => (
            <div className="order-card" key={o.id}>
              <div className="order-card-head">
                <strong>{o.buyer_name}</strong>
                <span className="mono-label">{o.order_no} · {fmtDate(o.created_at)}</span>
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
              {open === o.id && (
                <div className="order-expand">
                  <ShipTracker status={o.status} />
                  <dl className="spec">
                    <div><dt>Ship to</dt><dd>{o.ship_name} · {o.ship_phone}<br />{o.ship_address}</dd></div>
                    <div><dt>Courier</dt><dd>{o.courier}{o.tracking_no ? ` · ${o.tracking_no}` : ''}</dd></div>
                    <div><dt>Payment</dt><dd>{o.payment_method} · <StatusPill status={o.payment_status} /></dd></div>
                  </dl>
                </div>
              )}
              <div className="order-card-foot">
                <button className="link-btn" onClick={() => setOpen(open === o.id ? null : o.id)}>{open === o.id ? 'Hide details' : 'Shipping details'}</button>
                <div className="order-actions">
                  <button className="btn btn-sm btn-ghost" onClick={async () => {
                    const c = await api.get('/chat/conversations?as=shop');
                    const conv = c.find(x => x.buyer_id === o.user_id);
                    nav(conv ? `/seller/inbox/${conv.id}` : '/seller/inbox');
                  }}>💬 Buyer</button>
                  {['Placed', 'Packed'].includes(o.status) && <button className="btn btn-sm btn-ghost btn-danger" onClick={() => cancel(o)}>Cancel</button>}
                  {SHIP_FLOW.indexOf(o.status) > -1 && o.status !== 'Delivered' && (
                    <button className="btn btn-sm" onClick={() => advance(o)}>{NEXT_LABEL[o.status]}</button>
                  )}
                  <span>Earnings <strong className="price">{peso(o.subtotal)}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
