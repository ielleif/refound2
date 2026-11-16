import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, peso } from '../../api';
import { useApp } from '../../context/AppContext';
import { Empty, Loading } from '../../components/Common';
import ProductArt from '../../components/ProductArt';

export default function Listings() {
  const { toast } = useApp();
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');

  const load = () => api.get('/seller/products').then(setItems);
  useEffect(() => { load(); }, []);

  const remove = async p => {
    if (!window.confirm(`Delete “${p.name}”? Past orders will keep their record.`)) return;
    await api.del(`/seller/products/${p.id}`);
    toast('Listing deleted');
    load();
  };

  if (!items) return <Loading />;
  const shown = items.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="studio-head">
        <div>
          <span className="mono-label">Listings</span>
          <h1 className="display display-sm">Your items ({items.length})</h1>
        </div>
        <Link to="/seller/listings/new" className="btn">＋ Add a listing</Link>
      </div>
      {items.length === 0 ? (
        <Empty title="No listings yet" action={<Link to="/seller/listings/new" className="btn">List your first item</Link>}>
          Name it, price it, describe its condition — buyers will find it.
        </Empty>
      ) : (
        <section className="step-card">
          <input className="table-search" placeholder="Search your listings…" value={q} onChange={e => setQ(e.target.value)} />
          <table className="table">
            <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th></th></tr></thead>
            <tbody>
              {shown.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="table-item">
                      <ProductArt category={p.category_slug} color={p.art_color} image={p.image_url} seed={p.id} />
                      <div><Link to={`/product/${p.id}`} target="_blank"><strong>{p.name}</strong></Link><small>{p.condition_grade} · {p.era || '—'}</small></div>
                    </div>
                  </td>
                  <td>{p.category_name}</td>
                  <td>{peso(p.price)}</td>
                  <td>{p.stock > 0 ? p.stock : <span className="pill pill-muted">Sold out</span>}</td>
                  <td>{p.sold}</td>
                  <td className="table-actions">
                    <Link to={`/seller/listings/${p.id}/edit`} className="btn btn-sm btn-ghost">Edit</Link>
                    <button className="btn btn-sm btn-ghost btn-danger" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
