import { useId, useState } from 'react';

// Printed-label style illustration used when a listing has no photo.
const INK = '#1E1612';
const CREAM = '#F6EBDA';
const GOLD = '#F4B532';
// refound2 keeps everything on the red / orange / cream side
const WARM = { '#2F5D62': '#8E2316', '#1F3B2D': '#5E1B12', '#7A3E2B': '#B4532A', '#E3A82B': '#F4B532', '#D9412B': '#C8321F', '#F26B1D': '#F2661B', '#1E1B18': '#2A1C16' };

function Toy() {
  return (
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <line x1="150" y1="62" x2="150" y2="88" />
      <circle cx="150" cy="56" r="9" fill={GOLD} />
      <rect x="104" y="88" width="92" height="70" rx="12" fill={CREAM} />
      <circle cx="130" cy="120" r="11" fill={INK} />
      <circle cx="170" cy="120" r="11" fill={INK} />
      <circle cx="133" cy="117" r="3" fill={CREAM} stroke="none" />
      <circle cx="173" cy="117" r="3" fill={CREAM} stroke="none" />
      <rect x="132" y="140" width="36" height="7" rx="3" fill={INK} />
      <rect x="94" y="164" width="112" height="78" rx="10" fill={GOLD} />
      <circle cx="128" cy="196" r="10" fill={CREAM} />
      <rect x="150" y="186" width="38" height="8" rx="3" fill={CREAM} />
      <rect x="150" y="202" width="38" height="8" rx="3" fill={CREAM} />
      <rect x="68" y="172" width="22" height="50" rx="9" fill={CREAM} />
      <rect x="210" y="172" width="22" height="50" rx="9" fill={CREAM} />
    </g>
  );
}
function Snack() {
  return (
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <path d="M135 48 h30 v22 c0 14 22 26 22 54 v104 c0 10 -8 16 -18 16 h-38 c-10 0 -18 -6 -18 -16 v-104 c0 -28 22 -40 22 -54 z" fill={CREAM} />
      <rect x="131" y="40" width="38" height="14" rx="4" fill={GOLD} />
      <rect x="113" y="138" width="74" height="56" fill={GOLD} />
      <path d="M124 166 l12 -14 l12 14 l12 -14 l12 14" fill="none" />
      <line x1="125" y1="210" x2="125" y2="232" strokeLinecap="round" />
    </g>
  );
}
function Gadget() {
  return (
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <rect x="62" y="86" width="176" height="122" rx="12" fill={CREAM} />
      <rect x="84" y="104" width="132" height="56" rx="6" fill={GOLD} />
      <circle cx="120" cy="132" r="17" fill={CREAM} />
      <circle cx="180" cy="132" r="17" fill={CREAM} />
      <circle cx="120" cy="132" r="5" fill={INK} />
      <circle cx="180" cy="132" r="5" fill={INK} />
      <line x1="137" y1="132" x2="163" y2="132" />
      <path d="M100 208 l14 -30 h72 l14 30" fill={CREAM} />
      <circle cx="132" cy="194" r="4" fill={INK} />
      <circle cx="168" cy="194" r="4" fill={INK} />
    </g>
  );
}
function Merch() {
  return (
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <path d="M110 64 l-50 26 l18 42 l22 -10 v118 h100 v-118 l22 10 l18 -42 l-50 -26 c-4 16 -18 26 -40 26 s-36 -10 -40 -26 z" fill={CREAM} />
      <path d="M150 128 l9 20 l22 2 l-17 14 l6 22 l-20 -12 l-20 12 l6 -22 l-17 -14 l22 -2 z" fill={GOLD} />
      <line x1="118" y1="212" x2="182" y2="212" strokeLinecap="round" />
    </g>
  );
}
function Print() {
  return (
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <rect x="78" y="46" width="144" height="200" rx="4" fill={CREAM} />
      <rect x="78" y="46" width="144" height="40" fill={GOLD} />
      <text x="150" y="76" textAnchor="middle" fontFamily="Abril Fatface, Georgia, serif" fontSize="26" fill={INK} stroke="none">KOMIKS</text>
      <rect x="92" y="98" width="56" height="62" fill={CREAM} />
      <rect x="156" y="98" width="52" height="62" fill={GOLD} />
      <rect x="92" y="168" width="116" height="62" fill={CREAM} />
      <path d="M106 130 a12 12 0 1 1 24 0 a12 12 0 1 1 -24 0" fill={INK} />
      <path d="M170 210 c0 -18 24 -18 24 0" fill="none" />
      <path d="M108 196 h40 M108 212 h28" strokeLinecap="round" />
    </g>
  );
}
function Ad() {
  return (
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <rect x="54" y="70" width="192" height="150" rx="18" fill={CREAM} />
      <rect x="68" y="84" width="164" height="122" rx="10" fill="none" />
      {[[70, 86], [230, 86], [70, 204], [230, 204]].map(([x, y]) => (
        <circle key={x + '' + y} cx={x} cy={y} r="5" fill={INK} stroke="none" />
      ))}
      <circle cx="150" cy="138" r="40" fill={GOLD} />
      <text x="150" y="152" textAnchor="middle" fontFamily="Abril Fatface, Georgia, serif" fontSize="40" fill={INK} stroke="none">¡!</text>
      <path d="M90 184 h120" strokeLinecap="round" />
    </g>
  );
}


function Top() {
  return (
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <line x1="150" y1="50" x2="150" y2="92" strokeLinecap="round" />
      <rect x="138" y="44" width="24" height="16" rx="4" fill={GOLD} />
      <path d="M70 130 c0 -26 36 -40 80 -40 s80 14 80 40 c0 30 -40 70 -80 118 c-40 -48 -80 -88 -80 -118 z" fill={CREAM} />
      <path d="M72 132 c20 12 136 12 156 0" fill="none" />
      <path d="M86 160 c24 12 104 12 128 0" fill="none" />
      <path d="M100 132 l14 26 M150 138 v26 M200 132 l-14 26" strokeLinecap="round" />
      <path d="M118 186 c14 6 50 6 64 0 l-32 50 z" fill={GOLD} />
    </g>
  );
}
function ChipBag() {
  return (
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <path d="M86 58 l10 10 l10 -10 l10 10 l10 -10 l10 10 l10 -10 l10 10 l10 -10 l10 10 l10 -10 l10 10 l10 -10 v184 l-10 -10 l-10 10 l-10 -10 l-10 10 l-10 -10 l-10 10 l-10 -10 l-10 10 l-10 -10 l-10 10 l-10 -10 l-10 10 l-10 -10 z" fill={CREAM} />
      <circle cx="150" cy="138" r="40" fill={GOLD} />
      <path d="M128 130 c10 -16 34 -16 44 0 c-4 22 -40 22 -44 0 z" fill={CREAM} />
      <rect x="104" y="196" width="92" height="16" rx="3" fill={INK} />
    </g>
  );
}
function Phone() {
  return (
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <rect x="104" y="40" width="92" height="220" rx="30" fill={CREAM} />
      <rect x="118" y="72" width="64" height="56" rx="6" fill={GOLD} />
      <path d="M128 112 h14 v-10 h12 v10 h16" fill="none" strokeWidth="4" />
      <path d="M126 146 c8 -6 40 -6 48 0" fill="none" />
      {[0, 1, 2].map(r => [0, 1, 2].map(c => (
        <rect key={r + '-' + c} x={122 + c * 20} y={168 + r * 22} width="16" height="12" rx="4" fill={INK} stroke="none" />
      )))}
      <line x1="136" y1="54" x2="164" y2="54" strokeLinecap="round" />
    </g>
  );
}
function Mug() {
  return (
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <path d="M86 84 h108 v130 c0 18 -14 30 -30 30 h-48 c-16 0 -30 -12 -30 -30 z" fill={CREAM} />
      <path d="M194 112 h18 c18 0 26 12 26 30 s-8 30 -26 30 h-18" fill="none" strokeWidth="8" />
      <ellipse cx="140" cy="84" rx="54" ry="10" fill={GOLD} />
      <circle cx="140" cy="158" r="30" fill={GOLD} />
      <path d="M140 140 l6 12 l13 2 l-10 9 l3 13 l-12 -7 l-12 7 l3 -13 l-10 -9 l13 -2 z" fill={CREAM} strokeWidth="3" />
    </g>
  );
}
function Magazine() {
  return (
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <rect x="96" y="58" width="132" height="184" rx="3" fill={CREAM} transform="rotate(6 162 150)" />
      <rect x="72" y="52" width="136" height="190" rx="3" fill={CREAM} />
      <text x="140" y="90" textAnchor="middle" fontFamily="Abril Fatface, Georgia, serif" fontSize="24" fill={INK} stroke="none">MAGASIN</text>
      <line x1="84" y1="102" x2="196" y2="102" strokeWidth="3" />
      <circle cx="140" cy="158" r="38" fill={GOLD} />
      <path d="M122 170 c4 -26 32 -26 36 0" fill={CREAM} />
      <circle cx="140" cy="146" r="10" fill={CREAM} />
      <path d="M90 214 h70 M90 226 h44" strokeLinecap="round" />
    </g>
  );
}
function Calendar() {
  return (
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <rect x="70" y="56" width="160" height="196" rx="6" fill={CREAM} />
      <rect x="70" y="56" width="160" height="92" fill={GOLD} />
      <circle cx="150" cy="104" r="28" fill={CREAM} />
      <path d="M96 148 c20 -30 40 -30 54 -10 c14 -20 34 -20 54 10" fill="none" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={88 + (i % 4) * 32} y={164 + Math.floor(i / 4) * 26} width="22" height="14" rx="2" fill={i === 6 ? INK : 'none'} strokeWidth="3" />
      ))}
      <line x1="110" y1="44" x2="110" y2="68" strokeLinecap="round" />
      <line x1="190" y1="44" x2="190" y2="68" strokeLinecap="round" />
    </g>
  );
}

const ART = {
  toys: [Toy, Top], fastfood: [Toy, Merch], gadgets: [Gadget, Phone], print: [Print, Magazine],
  currency: [Calendar, Print], heritage: [Mug, Ad],
  // older collection names, kept so any existing listings still get a picture
  snacks: [Snack, ChipBag], merch: [Merch, Mug], ads: [Ad, Calendar],
};

// `seed` (usually the product id) picks between illustrations so a grid doesn't repeat.
export default function ProductArt({ category, color: rawColor = '#D9412B', era, image, className = '', label, seed = 0 }) {
  const color = WARM[rawColor] || rawColor;
  const id = useId().replace(/:/g, '');
  const [broken, setBroken] = useState(false);
  if (image && !broken) {
    return (
      <div className={`art ${className}`}>
        <img src={image} alt={label || ''} onError={() => setBroken(true)} />
        {era && <span className="art-era">{era}</span>}
      </div>
    );
  }
  const set = ART[category] || ART.toys;
  const Figure = set[Math.abs(Number(seed) || 0) % set.length];
  return (
    <div className={`art ${className}`} role="img" aria-label={label || category}>
      <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`dots${id}`} width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="2.1" fill={INK} opacity=".2" />
          </pattern>
        </defs>
        <rect width="300" height="300" fill={color} />
        <g opacity=".16" fill={CREAM}>
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={i} d="M150 150 L140 -60 L160 -60 Z" transform={`rotate(${i * 30} 150 150)`} />
          ))}
        </g>
        <rect width="300" height="300" fill={`url(#dots${id})`} />
        <circle cx="150" cy="150" r="118" fill="none" stroke={CREAM} strokeOpacity=".35" strokeWidth="2" strokeDasharray="4 7" />
        <Figure />
      </svg>
      {era && <span className="art-era">{era}</span>}
    </div>
  );
}
