import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Loading } from '../components/Common';

export default function Sellers() {
  const [shops, setShops] = useState(null);
  useEffect(() => { api.get('/shops').then(setShops).catch(() => setShops([])); }, []);
  return (
    <div className="container section">
      <span className="mono-label">Directory</span>
      <h1 className="display">The Keepers</h1>
      <p className="muted lead">Independent sellers bringing back the things the Philippines grew up with.</p>
      {!shops ? <Loading /> : (
        <div className="seller-grid">
          {shops.map(s => (
            <Link to={`/s/${s.slug}`} key={s.id} className="seller-card" style={{ '--c': s.color }}>
              <div className="seller-card-top"><span className="shop-mark">{s.name[0]}</span></div>
              <div className="seller-card-body">
                <h3>{s.name}</h3>
                <p>{s.tagline || 'New shop on RE:FOUND'}</p>
                <span className="mono-label">{s.location || 'Philippines'} · {s.product_count} listings</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
