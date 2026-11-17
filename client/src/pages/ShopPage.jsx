import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { Avatar, ProductCard, Loading, Empty } from '../components/Common';

export default function ShopPage() {
  const { slug } = useParams();
  const { user, shop: myShop, toast } = useApp();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api.get(`/shops/${slug}`).then(setData).catch(e => setErr(e.message)); }, [slug]);
  if (err) return <div className="container section"><Empty title="Shop not found">{err}</Empty></div>;
  if (!data) return <Loading />;
  const { shop, products } = data;
  const own = myShop?.id === shop.id;

  const chat = async () => {
    if (!user) return nav(`/login?next=/s/${slug}`);
    try {
      const c = await api.post('/chat/conversations', { shopId: shop.id });
      nav(`/messages/${c.id}`);
    } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <>
      <section className={`shop-banner ${shop.cover_url ? 'has-cover' : ''}`} style={{ '--c': shop.color, backgroundImage: shop.cover_url ? `url("${shop.cover_url}")` : undefined }}>
        <div className="container shop-banner-inner">
          <Avatar src={shop.logo_url} name={shop.name} color="var(--cream)" square className="shop-mark" />
          <div className="shop-banner-text">
            <span className="mono-label">Est. {new Date(shop.created_at).getFullYear()} · {shop.location || 'Philippines'}</span>
            <h1>{shop.name}</h1>
            {shop.tagline && <p className="shop-tagline">{shop.tagline}</p>}
          </div>
          <div className="shop-banner-actions">
            {own
              ? <Link to="/seller" className="btn btn-cream">Manage in Seller Studio</Link>
              : <button className="btn btn-cream" onClick={chat}>💬 Chat with seller</button>}
          </div>
        </div>
      </section>
      <div className="container section">
        <div className="shop-about">
          <p>{shop.description || 'This shop hasn’t written a story yet.'}</p>
          <dl className="spec spec-inline">
            <div><dt>Listings</dt><dd>{products.length}</dd></div>
            <div><dt>Delivered orders</dt><dd>{shop.sold_count}</dd></div>
            <div><dt>Keeper</dt><dd>{shop.owner_name}</dd></div>
          </dl>
        </div>
        {products.length === 0
          ? <Empty title="No listings yet">Check back soon.</Empty>
          : <div className="pgrid">{products.map(p => <ProductCard key={p.id} p={p} />)}</div>}
      </div>
    </>
  );
}
