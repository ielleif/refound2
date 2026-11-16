import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductArt from '../components/ProductArt';

function AuthShell({ title, kicker, children, aside }) {
  return (
    <div className="container section auth">
      <div className="auth-card">
        <span className="mono-label">{kicker}</span>
        <h1 className="display">{title}</h1>
        {children}
      </div>
      <div className="auth-aside">
        <ProductArt category="print" color="#D9412B" era="Since 2026" />
        <div className="auth-aside-text">{aside}</div>
      </div>
    </div>
  );
}

export function Login() {
  const { login, toast } = useApp();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const r = await login(form.email, form.password);
      toast(`Welcome back, ${r.user.name.split(' ')[0]}!`);
      nav(params.get('next') || '/');
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  return (
    <AuthShell title="Welcome back" kicker="Log in"
      aside={<><h3>Demo accounts</h3><p>Buyer: <code>juan@refound.ph</code><br />Seller: <code>ben@refound.ph</code><br />Password: <code>password123</code></p></>}>
      <form onSubmit={submit} className="form">
        {err && <div className="form-error">{err}</div>}
        <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" required autoComplete="current-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn btn-lg btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <button type="button" className="link-btn" onClick={() => setForm({ email: 'juan@refound.ph', password: 'password123' })}>Fill in demo buyer</button>
      </form>
      <p className="auth-switch">New here? <Link to={`/signup${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`}>Create an account</Link></p>
    </AuthShell>
  );
}

export function Signup() {
  const { signup, toast } = useApp();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) return setErr('Passwords do not match.');
    setErr(''); setBusy(true);
    try {
      await signup(form.name, form.email, form.password);
      toast('Account created. Maligayang pagdating!');
      nav(params.get('next') || '/');
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  return (
    <AuthShell title="Join RE:FOUND" kicker="Sign up"
      aside={<><h3>One account, two hats</h3><p>Buy with your personal profile, then open a shop anytime — it's bound to the same account, so you switch between them without logging out.</p></>}>
      <form onSubmit={submit} className="form">
        {err && <div className="form-error">{err}</div>}
        <label>Full name<input required autoComplete="name" {...f('name')} /></label>
        <label>Email<input type="email" required autoComplete="email" {...f('email')} /></label>
        <div className="form-row">
          <label>Password<input type="password" required minLength={6} autoComplete="new-password" {...f('password')} /></label>
          <label>Confirm<input type="password" required autoComplete="new-password" {...f('confirm')} /></label>
        </div>
        <button className="btn btn-lg btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthShell>
  );
}
