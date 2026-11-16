import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, getToken, setToken } from '../api';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState([]);
  const [unread, setUnread] = useState({ buyer: 0, shop: 0 });
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const toast = useCallback((msg, type = 'ok') => {
    const id = ++toastId.current;
    // Same message already showing? Don't stack it. Keep at most 3 on screen.
    setToasts(t => t.some(x => x.msg === msg) ? t : [...t, { id, msg, type }].slice(-3));
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!getToken()) return setCart([]);
    try { setCart(await api.get('/cart')); } catch { /* ignore */ }
  }, []);

  const refreshUnread = useCallback(async () => {
    if (!getToken()) return;
    try { setUnread(await api.get('/chat/unread')); } catch { /* ignore */ }
  }, []);

  const loadMe = useCallback(async () => {
    if (!getToken()) { setReady(true); return; }
    try {
      const { user, shop } = await api.get('/auth/me');
      setUser(user); setShop(shop);
    } catch (e) {
      if (e.status === 401) setToken(null);
    }
    setReady(true);
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);
  useEffect(() => {
    if (!user) return;
    refreshCart(); refreshUnread();
    const t = setInterval(refreshUnread, 5000);
    return () => clearInterval(t);
  }, [user, refreshCart, refreshUnread]);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    setToken(r.token); setUser(r.user); setShop(r.shop);
    return r;
  };
  const signup = async (name, email, password) => {
    const r = await api.post('/auth/signup', { name, email, password });
    setToken(r.token); setUser(r.user); setShop(null);
    return r;
  };
  const logout = () => {
    setToken(null); setUser(null); setShop(null); setCart([]); setUnread({ buyer: 0, shop: 0 });
  };

  const addToCart = async (productId, qty = 1) => {
    const c = await api.post('/cart', { productId, qty });
    setCart(c);
    return c;
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <AppCtx.Provider value={{
      user, setUser, shop, setShop, ready, login, signup, logout,
      cart, setCart, cartCount, refreshCart, addToCart,
      unread, refreshUnread, toast,
    }}>
      {children}
      <div className="toasts">
        {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}
      </div>
    </AppCtx.Provider>
  );
}
