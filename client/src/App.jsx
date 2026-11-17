import { useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import SellerLayout from './components/SellerLayout';
import { RequireAuth } from './components/Common';
import Disclaimer from './components/Disclaimer';

import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import ShopPage from './pages/ShopPage';
import Sellers from './pages/Sellers';
import { Login, Signup } from './pages/Auth';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { Orders, OrderDetail } from './pages/Orders';
import Messages from './pages/Messages';
import Account from './pages/Account';
import BecomeSeller from './pages/BecomeSeller';
import NotFound from './pages/NotFound';
import About from './pages/About';
import Contact from './pages/Contact';

import Dashboard from './pages/seller/Dashboard';
import Listings from './pages/seller/Listings';
import ListingForm from './pages/seller/ListingForm';
import SellerOrders from './pages/seller/SellerOrders';
import Inbox from './pages/seller/Inbox';
import Settings from './pages/seller/Settings';

function SiteLayout() {
  return (
    <>
      <Header />
      <main className="site-main"><Outlet /></main>
      <Footer />
    </>
  );
}

// Scroll to the top on each new page, or to a section when the link has #name (e.g. /#lookbook)
function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    let tries = 0;
    const t = setInterval(() => { // the section may appear a moment later, once data loads
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); clearInterval(t); }
      else if (++tries > 30) clearInterval(t);
    }, 100);
    return () => clearInterval(t);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Disclaimer />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:id" element={<Product />} />
          <Route path="s/:slug" element={<ShopPage />} />
          <Route path="sellers" element={<Sellers />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="cart" element={<RequireAuth><Cart /></RequireAuth>} />
          <Route path="checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
          <Route path="messages" element={<RequireAuth><Messages /></RequireAuth>} />
          <Route path="messages/:id" element={<RequireAuth><Messages /></RequireAuth>} />
          <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="sell" element={<BecomeSeller />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="seller" element={<RequireAuth shop><SellerLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="listings" element={<Listings />} />
          <Route path="listings/new" element={<ListingForm />} />
          <Route path="listings/:id/edit" element={<ListingForm />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="inbox/:id" element={<Inbox />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </>
  );
}
