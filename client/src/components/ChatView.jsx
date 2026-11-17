import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtTime, peso } from '../api';
import { useApp } from '../context/AppContext';
import ProductArt from './ProductArt';
import { Avatar, Empty } from './Common';

// Two-pane inbox used by both buyers (as="buyer") and sellers (as="shop").
export default function ChatView({ as, activeId, onSelect, basePath, attachProductId }) {
  const { refreshUnread, toast } = useApp();
  const [convs, setConvs] = useState(null);
  const [thread, setThread] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef();
  const lastCount = useRef(0);
  const [attach, setAttach] = useState(null);

  // A product the buyer came from ("Chat seller" button) — sent as a card with the next message.
  useEffect(() => {
    if (!attachProductId) { setAttach(null); return; }
    api.get(`/products/${attachProductId}`).then(d => setAttach(d.product)).catch(() => {});
  }, [attachProductId]);

  // Poll conversation list
  useEffect(() => {
    let alive = true;
    const load = () => api.get(`/chat/conversations?as=${as}`).then(c => alive && setConvs(c)).catch(() => {});
    load();
    const t = setInterval(load, 4000);
    return () => { alive = false; clearInterval(t); };
  }, [as]);

  // Poll active thread
  useEffect(() => {
    if (!activeId) { setThread(null); return; }
    let alive = true;
    lastCount.current = 0;
    const load = () => api.get(`/chat/conversations/${activeId}/messages?as=${as}`)
      .then(d => { if (alive) { setThread(d); refreshUnread(); } })
      .catch(e => alive && toast(e.message, 'err'));
    load();
    const t = setInterval(load, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [activeId, as, refreshUnread, toast]);

  useEffect(() => {
    const n = thread?.messages.length || 0;
    if (n !== lastCount.current) {
      endRef.current?.scrollIntoView({ block: 'end' });
      lastCount.current = n;
    }
  }, [thread]);

  const send = async e => {
    e.preventDefault();
    if (!text.trim() && !attach) return;
    setSending(true);
    try {
      await api.post(`/chat/conversations/${activeId}/messages`, { body: text, as, productId: attach?.id });
      setText(''); setAttach(null);
      const d = await api.get(`/chat/conversations/${activeId}/messages?as=${as}`);
      setThread(d);
    } catch (err) { toast(err.message, 'err'); }
    setSending(false);
  };

  const other = c => (as === 'buyer' ? c.shop_name : c.buyer_name);
  const otherColor = c => (as === 'buyer' ? c.shop_color : '#2F5D62');
  const quick = as === 'buyer'
    ? ['Available pa po ba?', 'Pwede po bang makita ang ibang photos?', 'Last price po?']
    : ['Available pa po!', 'Ships within 1–2 days po.', 'Salamat po sa order!'];

  return (
    <div className={`chat ${activeId ? 'has-active' : ''}`}>
      <aside className="chat-list">
        <div className="chat-list-head">
          <h3>{as === 'buyer' ? 'Messages' : 'Shop Inbox'}</h3>
          <span className="mono-label">{convs?.length || 0} chats</span>
        </div>
        {convs && convs.length === 0 && (
          <p className="chat-none">{as === 'buyer' ? 'No chats yet. Tap "Chat seller" on any product to start one.' : 'No buyer messages yet.'}</p>
        )}
        {convs?.map(c => (
          <button key={c.id} className={`chat-item ${String(c.id) === String(activeId) ? 'active' : ''}`} onClick={() => onSelect(c.id)}>
            {as === 'buyer'
              ? <Avatar src={c.shop_logo} name={c.shop_name} color={c.shop_color} square />
              : <Avatar src={c.buyer_avatar} name={c.buyer_name} color={otherColor(c)} />}
            <span className="chat-item-text">
              <strong>{other(c)}</strong>
              <small>{c.last_message || (c.product_name ? `Re: ${c.product_name}` : 'Say hello!')}</small>
            </span>
            {c.unread > 0 && <span className="badge badge-inline">{c.unread}</span>}
          </button>
        ))}
      </aside>

      <section className="chat-thread">
        {!activeId && <Empty title="Pick a conversation">Choose a chat on the left to read and reply.</Empty>}
        {activeId && thread && (
          <>
            <div className="chat-thread-head">
              <Link to={basePath} className="chat-back" aria-label="Back to chats">←</Link>
              {as === 'buyer'
                ? <Avatar src={thread.conversation.shop_logo} name={thread.conversation.shop_name} color={thread.conversation.shop_color} square />
                : <Avatar src={thread.conversation.buyer_avatar} name={thread.conversation.buyer_name} color="#2F5D62" />}
              <div>
                <strong>{as === 'buyer' ? thread.conversation.shop_name : thread.conversation.buyer_name}</strong>
                <small>{as === 'buyer'
                  ? <Link to={`/s/${thread.conversation.shop_slug}`}>Visit shop</Link>
                  : 'Buyer'}</small>
              </div>
            </div>
            <div className="chat-msgs">
              {thread.messages.length === 0 && <p className="chat-hint">Start the conversation — sellers usually reply within the day.</p>}
              {thread.messages.map(m => (
                <div key={m.id} className={`msg ${m.sender === as ? 'mine' : 'theirs'}`}>
                  {m.product_id && (
                    <Link to={`/product/${m.product_id}`} className="msg-product">
                      <ProductArt category={m.category_slug} color={m.art_color} image={m.image_url} seed={m.product_id} />
                      <span><strong>{m.product_name}</strong><small>{peso(m.product_price)}</small></span>
                    </Link>
                  )}
                  {m.body && <p>{m.body}</p>}
                  <time>{fmtTime(m.created_at)}</time>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="chat-quick">
              {quick.map(qr => <button key={qr} type="button" onClick={() => setText(qr)}>{qr}</button>)}
            </div>
            {attach && (
              <div className="chat-attach">
                <ProductArt category={attach.category_slug} color={attach.art_color} image={attach.image_url} seed={attach.id} />
                <span><small className="mono-label">Asking about</small><strong>{attach.name}</strong></span>
                <button type="button" onClick={() => setAttach(null)} aria-label="Remove item">×</button>
              </div>
            )}
            <form className="chat-input" onSubmit={send}>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message…" aria-label="Message" />
              <button className="btn" disabled={sending || (!text.trim() && !attach)}>Send</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
