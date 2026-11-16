import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { DashArrow, Pop, Sticker, Tag } from '../components/Deco';

const TOPICS = ['Order help', 'Selling on re:found', 'Report a listing', 'Partnership', 'Other'];
const FAQ = [
  ['Are the payments real?', 'No. re:found is a mock store. GCash, Maya, card and COD screens are simulated, and no money ever moves.'],
  ['How do I become a seller?', 'Log in, open the account menu and choose "Open a shop". Approval is instant, and your shop is bound to your personal account.'],
  ['Can I ask a seller for more photos?', 'Yes. Tap "Chat seller" on any product. The item is attached to your message so the seller knows what you mean.'],
  ['Where is my order?', 'Go to My Purchases and open the order to see every shipment update and the tracking number.'],
];

export default function Contact() {
  const { user, toast } = useApp();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', topic: TOPICS[0], message: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(null);
  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  const submit = async e => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const r = await api.post('/contact', form);
      setSent(r.ticket);
      toast('Message sent. Salamat!');
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  return (
    <>
      <section className="page-hero halftone-corners">
        <div className="container page-hero-inner">
          <Tag>Contact</Tag>
          <h1 className="page-hero-title">
            <span className="hero-find">Let's</span>
            <Pop tone="mustard">TALK!</Pop>
            <span className="page-hero-sub">Usually we reply within a day.</span>
          </h1>
          <DashArrow className="ph-dash" />
          <Sticker color="pink" tilt={-8} className="ph-st">Kamusta?</Sticker>
        </div>
      </section>

      <section className="container section contact">
        <div className="contact-cards">
          <div className="contact-card"><span className="contact-ico">✉</span><div><span className="mono-label">Email</span><strong>hello@refound.ph</strong><small>For orders, selling and everything else</small></div></div>
          <div className="contact-card contact-card-red"><span className="contact-ico">☎</span><div><span className="mono-label">Phone</span><strong>(02) 8123 4567</strong><small>Mon–Sat, 9:00 AM – 6:00 PM</small></div></div>
          <div className="contact-card"><span className="contact-ico">⌂</span><div><span className="mono-label">Visit</span><strong>Sta. Cruz, Manila</strong><small>Pop-up market, every last Sunday</small></div></div>
          <div className="contact-card"><span className="contact-ico">💬</span><div><span className="mono-label">Talk to a seller</span><strong>Use in-app chat</strong><small>Open any product and tap "Chat seller"</small></div></div>
        </div>

        <div className="contact-form-wrap">
          {sent ? (
            <div className="step-card contact-sent">
              <div className="stamp stamp-ok">Sent!<small>Salamat</small></div>
              <h2 className="display display-sm">We got your message.</h2>
              <p className="muted">Your reference number is <strong className="mono">{sent}</strong>. We'll reply to <strong>{form.email}</strong>.</p>
              <div className="hero-cta center">
                <button className="btn btn-cream" onClick={() => { setSent(null); setForm({ ...form, message: '' }); }}>Send another</button>
                <Link to="/shop" className="btn">Back to shopping ↗</Link>
              </div>
            </div>
          ) : (
            <form className="step-card form" onSubmit={submit}>
              <h3>Send us a message</h3>
              {err && <div className="form-error">{err}</div>}
              <div className="form-row">
                <label>Your name<input required maxLength={100} {...f('name')} /></label>
                <label>Email<input type="email" required maxLength={150} {...f('email')} /></label>
              </div>
              <label>Topic
                <select {...f('topic')}>{TOPICS.map(t => <option key={t}>{t}</option>)}</select>
              </label>
              <label>Message<textarea rows="6" required placeholder="Tell us what you're looking for, or how we can help…" {...f('message')} /></label>
              <div className="form-actions"><button className="btn btn-lg" disabled={busy}>{busy ? 'Sending…' : 'Send message ↗'}</button></div>
            </form>
          )}
        </div>
      </section>

      <section className="container section faq-wrap">
        <div className="center-head">
          <Tag>FAQ</Tag>
          <h2 className="display">Quick answers</h2>
        </div>
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
