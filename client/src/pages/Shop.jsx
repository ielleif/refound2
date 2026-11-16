import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { ProductCard, Loading, Empty } from '../components/Common';

const CONDITIONS = ['Sealed', 'Mint', 'Excellent', 'Good', 'Fair', 'For Display'];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState(null);
  const [min, setMin] = useState(params.get('min') || '');
  const [max, setMax] = useState(params.get('max') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || '';
  const condition = params.get('condition') || '';

  useEffect(() => { api.get('/categories').then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    setItems(null);
    api.get(`/products?${params.toString()}`).then(setItems).catch(() => setItems([]));
  }, [params]);

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next);
  };
  const applyPrice = e => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    min ? next.set('min', min) : next.delete('min');
    max ? next.set('max', max) : next.delete('max');
    setParams(next);
  };
  const current = cats.find(c => c.slug === category);

  return (
    <div className="container section shop-page">
      <div className="shop-head">
        <div>
          <span className="mono-label">{q ? 'Search results' : 'Catalogue'}</span>
          <h1 className="display">{q ? `“${q}”` : current ? current.name : 'All Finds'}</h1>
          {current && <p className="muted">{current.blurb}</p>}
        </div>
        <div className="shop-tools">
          <button className="btn btn-ghost btn-sm filters-toggle" onClick={() => setFiltersOpen(o => !o)}>Filters</button>
          <label className="select">
            <span className="mono-label">Sort</span>
            <select value={sort} onChange={e => set('sort', e.target.value)}>
              <option value="">Featured</option>
              <option value="newest">Newest listed</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="oldest">Oldest era first</option>
            </select>
          </label>
        </div>
      </div>

      <div className="shop-layout">
        <aside className={`filters ${filtersOpen ? 'open' : ''}`}>
          <div className="filter-block">
            <h4>Category</h4>
            <button className={!category ? 'active' : ''} onClick={() => set('category', '')}>All categories</button>
            {cats.map(c => (
              <button key={c.id} className={category === c.slug ? 'active' : ''} onClick={() => set('category', c.slug)}>
                {c.name} <span>{c.product_count}</span>
              </button>
            ))}
          </div>
          <div className="filter-block">
            <h4>Condition</h4>
            <div className="chips">
              {CONDITIONS.map(c => (
                <button key={c} className={`chip ${condition === c ? 'active' : ''}`} onClick={() => set('condition', condition === c ? '' : c)}>{c}</button>
              ))}
            </div>
          </div>
          <form className="filter-block" onSubmit={applyPrice}>
            <h4>Price (₱)</h4>
            <div className="price-range">
              <input type="number" min="0" placeholder="Min" value={min} onChange={e => setMin(e.target.value)} />
              <span>–</span>
              <input type="number" min="0" placeholder="Max" value={max} onChange={e => setMax(e.target.value)} />
            </div>
            <button className="btn btn-sm btn-block">Apply</button>
          </form>
          {[...params.keys()].length > 0 && (
            <button className="link-btn" onClick={() => { setMin(''); setMax(''); setParams({}); }}>Clear all filters</button>
          )}
        </aside>

        <div>
          {items === null ? <Loading /> : items.length === 0 ? (
            <Empty title="Nothing found in the baul">Try a different keyword or remove some filters.</Empty>
          ) : (
            <>
              <p className="mono-label result-count">{items.length} item{items.length > 1 ? 's' : ''}</p>
              <div className="pgrid pgrid-3">{items.map(p => <ProductCard key={p.id} p={p} />)}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
