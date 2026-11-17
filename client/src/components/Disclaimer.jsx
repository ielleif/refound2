import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sticker, Star } from './Deco';

const KEY = 'refound_disclaimer_seen_v1';
export const OPEN_EVENT = 'refound:show-disclaimer';

// Lets any link (e.g. in the footer) reopen the notice.
export const showDisclaimer = () => window.dispatchEvent(new Event(OPEN_EVENT));

function seen() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

// Shown on a visitor's first visit: this is a mock store, and the photos belong to their owners.
export default function Disclaimer() {
  const [open, setOpen] = useState(() => !seen());
  const btn = useRef();

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    btn.current?.focus();
    const onKey = e => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* private mode: just close */ }
    setOpen(false);
  };

  if (!open) return null;
  return createPortal(
    <div className="disclaimer-back" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
      <div className="disclaimer">
        <Sticker color="mustard" tilt={-6} className="disclaimer-sticker">Heads up!</Sticker>
        <Star className="disclaimer-star" />
        <h2 id="disclaimer-title">This is a <em>mock</em> store.</h2>
        <p className="disclaimer-lead">
          <strong>re:found</strong> is a student / portfolio project made to demonstrate an online marketplace.
          It is <strong>not a real business</strong>.
        </p>
        <ul className="disclaimer-list">
          <li><span>✕</span><div><strong>Nothing is actually for sale.</strong> Listings, prices and shops are for demonstration only.</div></li>
          <li><span>✕</span><div><strong>No real payments.</strong> GCash, Maya, card and COD screens are simulated, and no money is charged.</div></li>
          <li><span>✕</span><div><strong>No real deliveries.</strong> Orders and shipment tracking are pretend.</div></li>
        </ul>
        <div className="disclaimer-credit">
          <strong>Image credits:</strong> Product photos belong to their respective owners and are used here for
          non-commercial, educational purposes only. No copyright infringement intended. Full credit goes to the
          original photographers and owners.
        </div>
        <button ref={btn} className="btn btn-lg btn-block" onClick={close}>I understand, let me browse ↗</button>
        <p className="disclaimer-foot">Please don't enter real card details or personal information.</p>
      </div>
    </div>,
    document.body
  );
}
