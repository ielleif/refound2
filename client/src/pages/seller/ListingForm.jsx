import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, peso } from '../../api';
import { useApp } from '../../context/AppContext';
import { Loading } from '../../components/Common';
import ProductArt from '../../components/ProductArt';
import ImageUploader from '../../components/ImageUploader';

const CONDITIONS = ['Sealed', 'Mint', 'Excellent', 'Good', 'Fair', 'For Display'];
const ART_COLORS = ['#D9412B', '#F26B1D', '#E3A82B', '#2F5D62', '#1F3B2D', '#7A3E2B', '#1E1B18'];
const EMPTY = { name: '', price: '', category_id: '', condition_grade: 'Good', era: '', stock: 1, description: '', images: [], art_color: '#D9412B' };

export default function ListingForm() {
  const { id } = useParams();
  const { shop, toast } = useApp();
  const nav = useNavigate();
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(id ? null : EMPTY);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/categories').then(setCats);
    if (id) api.get('/seller/products').then(list => {
      const p = list.find(x => String(x.id) === id);
      if (!p) { toast('Listing not found', 'err'); nav('/seller/listings'); return; }
      setForm({ ...EMPTY, ...p, era: p.era || '', images: p.images || [], description: p.description || '' });
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!form) return <Loading />;
  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });
  const cat = cats.find(c => String(c.id) === String(form.category_id));

  const submit = async e => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (id) await api.put(`/seller/products/${id}`, form);
      else await api.post('/seller/products', form);
      toast(id ? 'Listing updated' : 'Listing published!');
      nav('/seller/listings');
    } catch (e2) { setErr(e2.message); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    setBusy(false);
  };

  return (
    <>
      <div className="studio-head">
        <div>
          <span className="mono-label">{id ? 'Edit listing' : 'New listing'}</span>
          <h1 className="display display-sm">{id ? form.name || 'Edit item' : 'List an item'}</h1>
        </div>
      </div>
      <div className="listing-layout">
        <form className="step-card form" onSubmit={submit}>
          {err && <div className="form-error">{err}</div>}
          <label>Item name *<input required maxLength={150} placeholder="e.g. Brick Game 9999-in-1 Handheld" {...f('name')} /></label>
          <div className="form-row">
            <label>Price (₱) *<input type="number" min="1" step="0.01" required {...f('price')} /></label>
            <label>Stock *<input type="number" min="0" required {...f('stock')} /></label>
          </div>
          <div className="form-row">
            <label>Category *
              <select required {...f('category_id')}>
                <option value="">Choose…</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Condition
              <select {...f('condition_grade')}>{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>
            </label>
          </div>
          <label>Era / year<input maxLength={20} placeholder="e.g. 1994 or 1980s" {...f('era')} /></label>
          <label>Description<textarea rows="5" placeholder="Where did it come from? Any flaws, missing parts or repairs?" {...f('description')} /></label>
          <ImageUploader value={form.images} onChange={images => setForm(fm => ({ ...fm, images }))} />
          {form.images.length === 0 && (
            <div>
              <span className="label-text">No photo? Pick a label colour for the illustrated tag</span>
              <div className="swatches">
                {ART_COLORS.map(c => (
                  <button type="button" key={c} className={`swatch ${form.art_color === c ? 'active' : ''}`} style={{ background: c }}
                    onClick={() => setForm({ ...form, art_color: c })} aria-label={`Colour ${c}`} />
                ))}
              </div>
            </div>
          )}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => nav('/seller/listings')}>Cancel</button>
            <button className="btn" disabled={busy}>{busy ? 'Saving…' : id ? 'Save changes' : 'Publish listing'}</button>
          </div>
        </form>

        <aside className="listing-preview">
          <span className="mono-label">Live preview</span>
          <div className="pcard pcard-static">
            <div className="pcard-art">
              <ProductArt category={cat?.slug || 'toys'} color={form.art_color} era={form.era} image={form.images[0]} seed={id || 0} />
              <span className="pcard-cond">{form.condition_grade}</span>
            </div>
            <div className="pcard-body">
              <span className="mono-label">{cat?.name || 'Category'}</span>
              <h3 className="pcard-name">{form.name || 'Your item name'}</h3>
              <div className="pcard-foot">
                <span className="price">{form.price ? peso(form.price) : '₱—'}</span>
                <span className="pcard-shop">{shop.name}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
