import { useRef, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context/AppContext';

export const MAX_PHOTOS = 7;

// Shrinks a photo in the browser (max 1600px, JPEG) so uploads stay small and fast.
function compress(file) {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/gif') { // keep GIFs as-is (may be animated)
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      return r.readAsDataURL(file);
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`“${file.name}” isn't a readable image.`)); };
    img.src = url;
  });
}

// Upload, reorder and remove up to 7 listing photos. The first photo is the cover.
export default function ImageUploader({ value, onChange }) {
  const { toast } = useApp();
  const input = useRef();
  const [busy, setBusy] = useState(0);
  const [drag, setDrag] = useState(false);
  const [link, setLink] = useState('');
  const left = MAX_PHOTOS - value.length;

  const addFiles = async fileList => {
    const files = [...fileList].filter(f => f.type.startsWith('image/'));
    if (!files.length) return toast('Please choose image files (JPG, PNG, WEBP, GIF).', 'err');
    if (left <= 0) return toast(`You already have ${MAX_PHOTOS} photos. Remove one to add another.`, 'err');
    const take = files.slice(0, left);
    if (files.length > left) toast(`Only ${left} more photo${left > 1 ? 's' : ''} allowed — added the first ${left}.`, 'err');
    setBusy(take.length);
    try {
      const data = await Promise.all(take.map(compress));
      const { urls } = await api.post('/seller/uploads', { images: data });
      onChange([...value, ...urls]);
    } catch (e) { toast(e.message, 'err'); }
    setBusy(0);
    if (input.current) input.current.value = '';
  };

  const addLink = () => {
    const u = link.trim();
    if (!/^https?:\/\/\S+$/.test(u)) return toast('Paste a full image link starting with http:// or https://', 'err');
    if (left <= 0) return toast(`You already have ${MAX_PHOTOS} photos.`, 'err');
    onChange([...value, u]);
    setLink('');
  };

  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = i => onChange(value.filter((_, k) => k !== i));
  const makeCover = i => onChange([value[i], ...value.filter((_, k) => k !== i)]);

  return (
    <div className="uploader">
      <div className="uploader-head">
        <span className="label-text">Photos</span>
        <span className="mono-label">{value.length} / {MAX_PHOTOS}</span>
      </div>

      {value.length > 0 && (
        <div className="uploader-grid">
          {value.map((u, i) => (
            <div className={`uploader-thumb ${i === 0 ? 'is-cover' : ''}`} key={u + i}>
              <img src={u} alt={`Photo ${i + 1}`} />
              {i === 0
                ? <span className="uploader-cover">Cover</span>
                : <button type="button" className="uploader-setcover" onClick={() => makeCover(i)}>Make cover</button>}
              <div className="uploader-tools">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left">←</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move right">→</button>
                <button type="button" onClick={() => remove(i)} aria-label="Remove photo" className="uploader-del">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {left > 0 && (
        <div
          className={`dropzone ${drag ? 'is-drag' : ''}`}
          onClick={() => !busy && input.current.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          role="button" tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && input.current.click()}
        >
          {busy ? (
            <><span className="spinner" /> Uploading {busy} photo{busy > 1 ? 's' : ''}…</>
          ) : (
            <>
              <strong>📷 Click to add photos</strong>
              <span>or drag them here · up to {left} more · JPG, PNG, WEBP, GIF</span>
            </>
          )}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden
            onChange={e => addFiles(e.target.files)} />
        </div>
      )}

      {left > 0 && (
        <div className="uploader-link">
          <input type="url" placeholder="…or paste an image link (https://…)" value={link}
            onChange={e => setLink(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} />
          <button type="button" className="btn btn-sm btn-ghost" onClick={addLink}>Add link</button>
        </div>
      )}
      <p className="muted small uploader-tip">The first photo is the cover shown in the shop grid. Show the real item from several angles, including any flaws.</p>
    </div>
  );
}
