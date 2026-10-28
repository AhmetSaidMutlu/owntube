// OwnTube logosu: siyah karo üzerinde beyaz TV, ekranda beyaz "OWN".
// app/icon.svg ve mobile/components/Logo.tsx ile aynı çizim.
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1024 1024" className={className} role="img" aria-label="OwnTube">
      <rect x="0" y="0" width="1024" height="1024" rx="224" fill="#000000" />
      <g transform="translate(512 512) scale(0.78) translate(-512 -491)">
        <g stroke="#FFFFFF" strokeWidth="36" strokeLinecap="round">
          <line x1="512" y1="300" x2="384" y2="150" />
          <line x1="512" y1="300" x2="640" y2="150" />
        </g>
        <circle cx="384" cy="150" r="28" fill="#FFFFFF" />
        <circle cx="640" cy="150" r="28" fill="#FFFFFF" />
        <rect x="300" y="780" width="56" height="80" rx="20" fill="#FFFFFF" />
        <rect x="668" y="780" width="56" height="80" rx="20" fill="#FFFFFF" />
        <rect x="152" y="290" width="720" height="510" rx="96" fill="#FFFFFF" />
        <rect x="212" y="350" width="600" height="390" rx="56" fill="#000000" />
        <g fill="none" stroke="#FFFFFF" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="323" cy="545" rx="45" ry="55" />
          <polyline points="442,490 482,600 517,530 552,600 592,490" />
          <polyline points="666,600 666,490 746,600 746,490" />
        </g>
      </g>
    </svg>
  )
}
