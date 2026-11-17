import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Avatar, Logo } from './Common';

const CATS = [['toys', 'Toys & Action Figures'], ['fastfood', 'Fast-Food Collectibles'], ['gadgets', 'Gadgets & Radios'],
  ['print', 'Komiks, Magazines & Posters'], ['currency', 'Coins, Stamps & Documents'], ['heritage', 'Antiques & Heritage']];

function useOutside(ref, close) {
  useEffect(() => {
    const h = e => ref.current && !ref.current.contains(e.target) && close();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, close]);
}

export default function Header() {
  const { user, shop, cartCount, unread, logout } = useApp();
  const [params] = useSearchParams();
  const loc = useLocation();
  const nav = useNavigate();
  const [q, setQ] = useState(params.get('q') || '');
  const [menu, setMenu] = useState(false);
  const [cats, setCats] = useState(false);
  const [mobile, setMobile] = useState(false);
  const menuRef = useRef();
  const catRef = useRef();
  useOutside(menuRef, () => setMenu(false));
  useOutside(catRef, () => setCats(false));
  useEffect(() => { setMobile(false); setCats(false); }, [loc.pathname, loc.search]);

  const search = e => {
    e.preventDefault();
    nav(`/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <header className={`site-header ${mobile ? 'is-open' : ''}`}>
      <div className="header-main container">
        <Logo />
        <button className="burger" onClick={() => setMobile(m => !m)} aria-label="Menu" aria-expanded={mobile}>
          <span /><span /><span />
        </button>

        <nav className="header-nav">
          <NavLink to="/" end>Home</NavLink>
          {/* Shop goes to all finds; the arrow (or hovering) opens the collections */}
          <div className={`dropdown nav-split ${cats ? 'open' : ''}`} ref={catRef}
            onMouseEnter={() => setCats(true)} onMouseLeave={() => setCats(false)}>
            <NavLink to="/shop" end className={() => (loc.pathname === '/shop' ? 'active' : '')}>Shop</NavLink>
            <button className="dropdown-caret" onClick={() => setCats(c => (window.matchMedia('(hover: hover)').matches ? true : !c))} aria-expanded={cats} aria-label="Show collections">▾</button>
            {cats && (
              <div className="dropdown-menu">
                <Link to="/shop" className="dropdown-all">All finds</Link>
                {CATS.map(([slug, label]) => <Link key={slug} to={`/shop?category=${slug}`}>{label}</Link>)}
              </div>
            )}
          </div>
          <NavLink to="/sellers">Sellers</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>

        <form className="search" onSubmit={search} role="search">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search finds…" aria-label="Search products" />
          <button type="submit" aria-label="Search">
            <svg viewBox="0 0 24 24" width="17" height="17"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.6" /><path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
          </button>
        </form>

        <div className="header-actions">
          {user ? (
            <>
              <Link to="/messages" className="icon-btn" title="Messages" aria-label="Messages">
                <svg viewBox="0 0 24 24" width="21" height="21"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /></svg>
                {unread.buyer > 0 && <span className="badge">{unread.buyer}</span>}
              </Link>
              <Link to="/cart" className="icon-btn" title="Cart" aria-label="Cart">
                <svg viewBox="0 0 24 24" width="21" height="21"><path d="M3 4h3l2.4 11h10.2L21 7H7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /><circle cx="10" cy="19.5" r="1.6" fill="currentColor" /><circle cx="17" cy="19.5" r="1.6" fill="currentColor" /></svg>
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </Link>
              <div className="account" ref={menuRef}>
                <button className="account-btn" onClick={() => setMenu(m => !m)} aria-expanded={menu}>
                  <Avatar src={user.avatar_url} name={user.name} />
                  <span className="account-name">{user.name.split(' ')[0]}</span>
                  <span aria-hidden>▾</span>
                </button>
                {menu && (
                  <div className="menu" onClick={() => setMenu(false)}>
                    <div className="menu-head menu-head-row"><Avatar src={user.avatar_url} name={user.name} size={42} /><div><strong>{user.name}</strong><span>{user.email}</span></div></div>
                    <Link to="/account">My Account</Link>
                    <Link to="/orders">My Purchases</Link>
                    <Link to="/messages">Messages</Link>
                    <div className="menu-sep">Switch profile</div>
                    {shop ? (
                      <Link to="/seller" className="menu-switch">
                        <Avatar src={shop.logo_url} name={shop.name} color={shop.color} square />
                        <span><strong>{shop.name}</strong><small>Go to Seller Studio{unread.shop ? ` · ${unread.shop} new` : ''}</small></span>
                      </Link>
                    ) : (
                      <Link to="/sell" className="menu-switch">
                        <span className="avatar avatar-sq avatar-add">+</span>
                        <span><strong>Open a shop</strong><small>Sell your old finds</small></span>
                      </Link>
                    )}
                    <button className="menu-logout" onClick={() => { logout(); nav('/'); }}>Log out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="header-login">Log in</Link>
              <Link to="/signup" className="btn btn-sm">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
