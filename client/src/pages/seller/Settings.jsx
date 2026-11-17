import { useState } from 'react';
import { Avatar } from '../../components/Common';
import { api } from '../../api';
import { useApp } from '../../context/AppContext';
import { SHOP_COLORS } from '../BecomeSeller';
import ProfilePhotos from '../../components/ProfilePhotos';

export default function Settings() {
  const { shop, setShop, toast } = useApp();
  const [form, setForm] = useState({
    name: shop.name, tagline: shop.tagline || '', description: shop.description || '',
    location: shop.location || '', color: shop.color,
  });
  const [busy, setBusy] = useState(false);
  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  const save = async e => {
    e.preventDefault();
    setBusy(true);
    try { setShop(await api.put('/seller/shop', form)); toast('Shop updated'); }
    catch (e2) { toast(e2.message, 'err'); }
    setBusy(false);
  };

  return (
    <>
      <div className="studio-head">
        <div>
          <span className="mono-label">Shop settings</span>
          <h1 className="display display-sm">Your shop page</h1>
        </div>
      </div>
      <ProfilePhotos
        name={shop.name} square color={shop.color}
        subtitle={shop.tagline || 'Add a logo and a cover photo so buyers recognise your shop.'}
        avatar={shop.logo_url} cover={shop.cover_url}
        onSave={async (kind, url) => setShop(await api.put('/seller/shop', { [kind === 'avatar' ? 'logo_url' : 'cover_url']: url }))}
      >
        <a href={`/s/${shop.slug}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-cream">View shop page ↗</a>
      </ProfilePhotos>
      <div className="listing-layout">
        <form className="step-card form" onSubmit={save}>
          <label>Shop name<input required maxLength={60} {...f('name')} /></label>
          <label>Tagline<input maxLength={100} {...f('tagline')} /></label>
          <label>Location<input {...f('location')} /></label>
          <label>About<textarea rows="4" {...f('description')} /></label>
          <div>
            <span className="label-text">Shop colour</span>
            <div className="swatches">
              {SHOP_COLORS.map(c => (
                <button type="button" key={c} className={`swatch ${form.color === c ? 'active' : ''}`} style={{ background: c }}
                  onClick={() => setForm({ ...form, color: c })} aria-label={`Colour ${c}`} />
              ))}
            </div>
          </div>
          <div className="form-actions"><button className="btn" disabled={busy}>Save changes</button></div>
        </form>
        <aside className="listing-preview">
          <span className="mono-label">Banner preview</span>
          <div className={`shop-banner shop-banner-mini ${shop.cover_url ? 'has-cover' : ''}`} style={{ '--c': form.color, backgroundImage: shop.cover_url ? `url("${shop.cover_url}")` : undefined }}>
            <Avatar src={shop.logo_url} name={form.name} color={form.color} square className="shop-mark" />
            <div><h1>{form.name || 'Shop name'}</h1><p className="shop-tagline">{form.tagline}</p></div>
          </div>
        </aside>
      </div>
    </>
  );
}
