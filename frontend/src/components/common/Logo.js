// CAISSA logo, drawn as SVG: rook mark inside a dotted ring, a diamond and fine circles.
const ROOK = `
  <g fill="#e4e4e6">
    <polygon points="122,120 140,130 160,112 180,130 198,120 192,138 128,138"/>
    <circle cx="122" cy="110" r="4.2"/><circle cx="160" cy="101" r="4.2"/><circle cx="198" cy="110" r="4.2"/>
    <polygon points="141,138 179,138 185,190 135,190"/>
  </g>
  <rect x="123" y="191" width="74" height="10" rx="3" fill="#b9b9be"/>`;

export function logoSvg({ animated = false } = {}) {
  return `<svg class="logo-svg${animated ? " animated" : ""}" viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CAISSA">
    <circle cx="160" cy="150" r="128" fill="none" stroke="rgba(255,255,255,0.10)"/>
    <circle cx="160" cy="150" r="100" fill="none" stroke="rgba(255,255,255,0.18)"/>
    <line x1="0" y1="150" x2="320" y2="150" stroke="rgba(255,255,255,0.14)" stroke-dasharray="3 5"/>
    <rect class="diamond" x="90.7" y="80.7" width="138.6" height="138.6" transform="rotate(45 160 150)" fill="none" stroke="rgba(255,255,255,0.45)"/>
    <circle class="dash-ring" cx="160" cy="150" r="84" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-dasharray="2 6.2" stroke-linecap="round"/>
    ${ROOK}
  </svg>`;
}

// Just the rook, for small spaces (sidebar, onboarding).
export function rookMarkSvg() {
  return `<svg viewBox="112 92 96 118" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${ROOK}</svg>`;
}
