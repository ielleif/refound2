import { Link, NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// The seller "page" — reached from the personal account without logging out.
export default function SellerLayout() {
  const { user, shop, unread } = useApp();
  return (
    <div className="studio">
      <header className="studio-bar">
        <div className="studio-brand">
          <Link to="/seller" className="studio-logo"><span>re:</span>found <em>seller studio</em></Link>
        </div>
        <div className="studio-identity">
          <span className="mono-label">Managing as</span>
          <span className="avatar avatar-sq" style={{ background: shop.color }}>{shop.name[0]}</span>
          <strong>{shop.name}</strong>
        </div>
        <Link to="/" className="studio-switch" title="Switch back to your personal profile">
          <span className="avatar">{user.name[0]}</span>
          <span>Switch to <strong>{user.name.split(' ')[0]}</strong></span>
        </Link>
      </header>
      <div className="studio-body">
        <nav className="studio-nav">
          <NavLink to="/seller" end><span>◉</span> Dashboard</NavLink>
          <NavLink to="/seller/listings" end><span>▤</span> Listings</NavLink>
          <NavLink to="/seller/listings/new"><span>＋</span> Add a listing</NavLink>
          <NavLink to="/seller/orders"><span>▣</span> Orders</NavLink>
          <NavLink to="/seller/inbox"><span>✉</span> Inbox {unread.shop > 0 && <b className="badge badge-inline">{unread.shop}</b>}</NavLink>
          <NavLink to="/seller/settings"><span>✎</span> Shop settings</NavLink>
          <a href={`/s/${shop.slug}`} target="_blank" rel="noreferrer"><span>↗</span> View public page</a>
        </nav>
        <main className="studio-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
