import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Product photo carousel: arrows, thumbnails, swipe, keyboard, and a full-screen view.
export default function ImageCarousel({ images, alt = '', era }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touchX = useRef(null);
  const n = images.length;

  useEffect(() => { setIdx(0); }, [images]);
  const go = d => setIdx(i => (i + d + n) % n);

  // Arrow keys + Esc while the full-screen view is open
  useEffect(() => {
    if (!zoom) return;
    const onKey = e => {
      if (e.key === 'Escape') setZoom(false);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [zoom, n]); // eslint-disable-line react-hooks/exhaustive-deps

  const swipe = {
    onTouchStart: e => { touchX.current = e.touches[0].clientX; },
    onTouchEnd: e => {
      if (touchX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      touchX.current = null;
    },
  };

  return (
    <div className="carousel">
      <div className="carousel-stage" tabIndex={0} {...swipe}
        onKeyDown={e => { if (zoom) return; if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); if (e.key === 'Enter') setZoom(true); }}
        aria-roledescription="carousel" aria-label={`${alt} photos`}>
        <div className="carousel-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {images.map((src, i) => (
            <button type="button" className="carousel-slide" key={src + i} onClick={() => setZoom(true)}
              aria-label={`Open photo ${i + 1} full screen`} tabIndex={-1}>
              <img src={src} alt={`${alt} — photo ${i + 1} of ${n}`} loading={i === 0 ? 'eager' : 'lazy'} draggable="false" />
            </button>
          ))}
        </div>
        {n > 1 && (
          <>
            <button type="button" className="carousel-arrow prev" onClick={() => go(-1)} aria-label="Previous photo">‹</button>
            <button type="button" className="carousel-arrow next" onClick={() => go(1)} aria-label="Next photo">›</button>
            <span className="carousel-count">{idx + 1} / {n}</span>
          </>
        )}
        {era && <span className="art-era">{era}</span>}
        <span className="carousel-zoomhint">⤢ Click to enlarge</span>
      </div>

      {n > 1 && (
        <div className="carousel-thumbs">
          {images.map((src, i) => (
            <button type="button" key={src + i} className={i === idx ? 'active' : ''} onClick={() => setIdx(i)}
              aria-label={`Show photo ${i + 1}`} aria-current={i === idx}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}

      {zoom && createPortal(
        <div className="lightbox" onClick={() => setZoom(false)} {...swipe} role="dialog" aria-modal="true" aria-label="Photo viewer">
          <img src={images[idx]} alt={`${alt} — photo ${idx + 1} of ${n}`} onClick={e => e.stopPropagation()} />
          <button type="button" className="lightbox-close" onClick={() => setZoom(false)} aria-label="Close">×</button>
          {n > 1 && (
            <>
              <button type="button" className="carousel-arrow prev" onClick={e => { e.stopPropagation(); go(-1); }} aria-label="Previous photo">‹</button>
              <button type="button" className="carousel-arrow next" onClick={e => { e.stopPropagation(); go(1); }} aria-label="Next photo">›</button>
              <span className="lightbox-count">{idx + 1} / {n}</span>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
