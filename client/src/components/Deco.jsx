// Collage decorations: stickers, bolts, squiggles, tape ribbons and polaroids.
import { useId } from 'react';
import { Link } from 'react-router-dom';
import ProductArt from './ProductArt';

const INK = '#1E1612';

export function Tag({ children, className = '' }) {
  return <span className={`tag ${className}`}><i aria-hidden /> {children}</span>;
}

export function Sticker({ children, color = 'pink', tilt = -8, className = '', style }) {
  return (
    <span className={`sticker sticker-${color} ${className}`} style={{ '--tilt': `${tilt}deg`, ...style }} aria-hidden>
      {children}
    </span>
  );
}

// Big chunky 3D word with halftone fill
export function Pop({ children, tone = 'orange', as: El = 'span', className = '' }) {
  return <El className={`pop pop-${tone} ${className}`} data-text={children}>{children}</El>;
}

export function Bolt({ className = '', style }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`deco bolt ${className}`} style={style} viewBox="0 0 120 220" aria-hidden>
      <defs>
        <pattern id={`ht${id}`} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" fill={INK} opacity=".25" />
        </pattern>
      </defs>
      <path d="M78 4 L10 112 L52 112 L28 216 L112 84 L66 84 L96 4 Z" fill="#F2661B" stroke={INK} strokeWidth="6" strokeLinejoin="round" transform="translate(8 6)" />
      <path d="M78 4 L10 112 L52 112 L28 216 L112 84 L66 84 L96 4 Z" fill="#F29A8E" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      <path d="M78 4 L10 112 L52 112 L28 216 L112 84 L66 84 L96 4 Z" fill={`url(#ht${id})`} />
      <path d="M78 4 L52 50 L70 50 Z" fill="#C8321F" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

export function Heart({ className = '', style }) {
  return (
    <svg className={`deco heart ${className}`} style={style} viewBox="0 0 60 56" aria-hidden>
      <path d="M30 52 C8 36 2 26 4 16 C6 6 18 2 26 10 L30 14 L34 10 C42 2 54 6 56 16 C58 26 52 36 30 52 Z" fill="#E8452C" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M14 16 c2 -5 7 -6 10 -4" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

export function Squiggle({ className = '', style, color = '#F6EBDA' }) {
  return (
    <svg className={`deco squiggle ${className}`} style={style} viewBox="0 0 90 170" aria-hidden>
      <path d="M70 8 C20 6 14 40 46 52 C80 64 74 96 40 100 C10 104 14 130 40 140" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
      <path d="M22 124 L38 146 L60 130" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DashArrow({ className = '', style }) {
  return (
    <svg className={`deco dash-arrow ${className}`} style={style} viewBox="0 0 200 140" aria-hidden>
      <path d="M6 10 C70 0 110 30 90 60 C72 88 120 110 170 112" fill="none" stroke={INK} strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" />
      <path d="M160 96 L182 114 L156 126 Z" fill="#F2661B" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

export function Star({ className = '', style }) {
  return (
    <svg className={`deco star ${className}`} style={style} viewBox="0 0 60 60" aria-hidden>
      <path d="M30 2 L37 22 L58 22 L41 35 L48 56 L30 43 L12 56 L19 35 L2 22 L23 22 Z" fill="#F4B532" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

// Slanted marquee tape strip
export function Ribbon({ items, tone = 'cream', tilt = -3, reverse = false }) {
  const row = [...items, ...items, ...items, ...items];
  return (
    <div className={`ribbon ribbon-${tone}`} style={{ '--tilt': `${tilt}deg` }} aria-hidden>
      <div className={`ribbon-track ${reverse ? 'rev' : ''}`}>
        {[0, 1].map(k => (
          <span key={k} className="ribbon-set">
            {row.map((t, i) => <span key={i}>{t} <b>{i % 2 ? '▲' : '●'}</b></span>)}
          </span>
        ))}
      </div>
    </div>
  );
}

// Tilted polaroid around a product picture
export function Polaroid({ product, tilt = -6, caption, className = '', style, gray = false }) {
  const inner = (
    <>
      <div className={`polaroid-pic ${gray ? 'is-gray' : ''}`}>
        <ProductArt category={product?.category_slug || 'toys'} color={product?.art_color} image={product?.image_url}
          seed={product?.id || 0} label={product?.name} />
      </div>
      {caption !== false && <span className="polaroid-cap">{caption || product?.name}</span>}
    </>
  );
  const props = { className: `polaroid ${className}`, style: { '--tilt': `${tilt}deg`, ...style } };
  return product?.id ? <Link to={`/product/${product.id}`} {...props}>{inner}</Link> : <div {...props}>{inner}</div>;
}

// Wobbly cream blob with ink outline (hero backdrop)
export function Blob({ className = '' }) {
  return (
    <svg className={`blob ${className}`} viewBox="0 0 1000 640" preserveAspectRatio="none" aria-hidden>
      <path d="M150 70 C260 20 380 60 470 40 C600 10 690 70 790 50 C900 30 980 110 960 220 C945 300 990 360 970 450 C950 560 860 610 740 600 C620 590 560 630 450 620 C330 610 240 640 150 590 C50 540 20 450 40 360 C55 290 10 230 30 170 C50 110 90 95 150 70 Z"
        fill="#F6EBDA" stroke={INK} strokeWidth="5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
