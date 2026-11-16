import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate, peso } from '../../api';
import { useApp } from '../../context/AppContext';
import { Loading, StatusPill } from '../../components/Common';

export default function Dashboard() {
  const { shop } = useApp();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/seller/stats').then(setStats);
    api.get('/seller/orders').then(o => setOrders(o.slice(0, 5)));
  }, []);

  if (!stats) return <Loading />;
  return (
    <>
      <div className="studio-head">
        <div>
          <span className="mono-label">Dashboard</span>
          <h1 className="display display-sm">Magandang araw, {shop.name}!</h1>
        </div>
        <Link to="/seller/listings/new" className="btn">＋ Add a listing</Link>
      </div>
      <div className="stat-grid">
        <div className="stat"><span className="mono-label">Revenue</span><strong>{peso(stats.revenue)}</strong><small>excl. shipping &amp; cancelled</small></div>
        <Link to="/seller/orders" className="stat stat-accent"><span className="mono-label">To ship</span><strong>{stats.to_ship}</strong><small>orders waiting →</small></Link>
        <div className="stat"><span className="mono-label">Total orders</span><strong>{stats.orders}</strong><small>all time</small></div>
        <Link to="/seller/listings" className="stat"><span className="mono-label">Active listings</span><strong>{stats.listings}</strong><small>{stats.sold_out} sold out</small></Link>
        <Link to="/seller/inbox" className="stat"><span className="mono-label">Unread chats</span><strong>{stats.unread}</strong><small>open inbox →</small></Link>
      </div>

      <section className="step-card">
        <div className="section-head section-head-tight">
          <h3>Recent orders</h3>
          <Link to="/seller/orders" className="link-arrow">All orders →</Link>
        </div>
        {orders.length === 0 ? (
          <p className="muted">No orders yet. Share your shop page and add more listings to get discovered.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Order</th><th>Buyer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td><span className="mono">{o.order_no}</span><br /><small className="muted">{fmtDate(o.created_at)}</small></td>
                  <td>{o.buyer_name}</td>
                  <td>{o.items.map(i => i.name).join(', ')}</td>
                  <td>{peso(o.subtotal)}</td>
                  <td><StatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
