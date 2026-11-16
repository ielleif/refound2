import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';

export const SHOP_COLORS = ['#D9412B', '#F26B1D', '#E3A82B', '#2F5D62', '#1F3B2D', '#7A3E2B', '#1E1B18'];

export default function BecomeSeller() {
  const { user, shop, setShop, toast } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', tagline: '', description: '', location: '', color: SHOP_COLORS[0], agree: false });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (shop) return <Navigate to="/seller" replace />;

  const submit = async e => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const r = await api.post('/seller/apply', form);
      setShop(r.shop);
      toast('Approved! Your shop is live.');
      nav('/seller');
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="container section">
      <div className="sell-hero">
        <div>
          <span className="mono-label">Sell on RE:FOUND</span>
          <h1 className="display">Turn the baul into a business.</h1>
          <ul className="ticks">
            <li>Your shop is a page bound to your personal account — switch between buying and selling without logging out.</li>
            <li>No admin, no waiting. Applications are approved instantly.</li>
            <li>List items with price, condition, era and photos. Chat with buyers directly.</li>
          </ul>
        </div>

        {!user ? (
          <div className="step-card center">
            <h3>Log in to open a shop</h3>
            <p className="muted">Shops are attached to a personal account.</p>
            <Link to="/login?next=/sell" className="btn btn-block">Log in</Link>
            <Link to="/signup?next=/sell" className="link-btn">or create an account</Link>
          </div>
        ) : (
          <form className="step-card form" onSubmit={submit}>
            <h3>Seller application</h3>
            {err && <div className="form-error">{err}</div>}
            <label>Shop name *<input required maxLength={60} placeholder="e.g. Baul ni Lola" {...f('name')} /></label>
            <label>Tagline<input maxLength={100} placeholder="A short line about your shop" {...f('tagline')} /></label>
            <label>Location<input placeholder="City / province" {...f('location')} /></label>
            <label>About your shop<textarea rows="3" placeholder="Where do your items come from?" {...f('description')} /></label>
            <div>
              <span className="label-text">Shop colour</span>
              <div className="swatches">
                {SHOP_COLORS.map(c => (
                  <button type="button" key={c} className={`swatch ${form.color === c ? 'active' : ''}`} style={{ background: c }}
                    onClick={() => setForm({ ...form, color: c })} aria-label={`Colour ${c}`} />
                ))}
              </div>
            </div>
            <label className="check">
              <input type="checkbox" checked={form.agree} onChange={e => setForm({ ...form, agree: e.target.checked })} />
              I'll list only items I own, describe their condition honestly, and ship what I sell.
            </label>
            <p className="muted small">Applying as <strong>{user.name}</strong> ({user.email})</p>
            <button className="btn btn-lg btn-block" disabled={busy || !form.agree}>{busy ? 'Approving…' : 'Open my shop'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
