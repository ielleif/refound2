import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import ProfilePhotos from '../components/ProfilePhotos';
import { Avatar } from '../components/Common';

export default function Account() {
  const { user, setUser, shop, toast } = useApp();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', address: user.address || '' });
  const [busy, setBusy] = useState(false);

  const save = async e => {
    e.preventDefault();
    setBusy(true);
    try { const r = await api.put('/auth/me', form); setUser(r.user); toast('Profile saved'); }
    catch (e2) { toast(e2.message, 'err'); }
    setBusy(false);
  };

  return (
    <div className="container section">
      <span className="mono-label">Personal profile</span>
      <h1 className="display">My Account</h1>
      <ProfilePhotos
        name={user.name}
        subtitle={`${user.email}${user.created_at ? ` · Member since ${new Date(user.created_at).getFullYear()}` : ''}`}
        avatar={user.avatar_url} cover={user.cover_url} color="#F2661B"
        onSave={async (kind, url) => {
          const r = await api.put('/auth/me', { [kind === 'avatar' ? 'avatar_url' : 'cover_url']: url });
          setUser(r.user);
        }}
      />
      <div className="account-grid">
        <form className="step-card form" onSubmit={save}>
          <h3>Profile &amp; default address</h3>
          <label>Full name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
          <label>Email<input value={user.email} disabled /></label>
          <label>Mobile number<input value={form.phone} placeholder="0917 123 4567" onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Default shipping address<textarea rows="3" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
          <button className="btn" disabled={busy}>Save changes</button>
        </form>
        <div>
          <div className="step-card bound-shop">
            <h3>Bound seller page</h3>
            {shop ? (
              <>
                <div className="seller-box" style={{ '--c': shop.color }}>
                  <Avatar src={shop.logo_url} name={shop.name} color={shop.color} square size={48} />
                  <div><strong>{shop.name}</strong><small>{shop.tagline || 'Your shop'}</small></div>
                </div>
                <p className="muted small">Your shop is linked to this account. Switching to it doesn't log you out.</p>
                <Link to="/seller" className="btn btn-block">Switch to {shop.name} →</Link>
              </>
            ) : (
              <>
                <p className="muted">You don't have a shop yet. Open one and it will be bound to this account — approval is instant.</p>
                <Link to="/sell" className="btn btn-block">Open a shop</Link>
              </>
            )}
          </div>
          <div className="step-card quick-links">
            <Link to="/orders">📦 My purchases</Link>
            <Link to="/messages">💬 Messages</Link>
            <Link to="/cart">🛒 Cart</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
