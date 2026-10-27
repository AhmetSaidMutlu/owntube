import Svg, { Circle, Ellipse, G, Line, Polyline, Rect } from 'react-native-svg'

// OwnTube logosu: TV içinde "OWN". Web'deki components/logo.tsx ile aynı çizim.
export function Logo({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * 760) / 744} viewBox="140 110 744 760" accessibilityLabel="OwnTube">
      <G stroke="#FF0033" strokeWidth={36} strokeLinecap="round">
        <Line x1="512" y1="300" x2="384" y2="150" />
        <Line x1="512" y1="300" x2="640" y2="150" />
      </G>
      <Circle cx="384" cy="150" r="28" fill="#FF0033" />
      <Circle cx="640" cy="150" r="28" fill="#FF0033" />
      <Rect x="300" y="780" width="56" height="80" rx="20" fill="#FF0033" />
      <Rect x="668" y="780" width="56" height="80" rx="20" fill="#FF0033" />
      <Rect x="152" y="290" width="720" height="510" rx="96" fill="#FF0033" />
      <Rect x="212" y="350" width="600" height="390" rx="56" fill="#0a0a0a" />
      <G fill="none" stroke="#FFFFFF" strokeWidth={40} strokeLinecap="round" strokeLinejoin="round">
        <Ellipse cx="323" cy="545" rx="45" ry="55" />
        <Polyline points="442,490 482,600 517,530 552,600 592,490" />
        <Polyline points="666,600 666,490 746,600 746,490" />
      </G>
    </Svg>
  )
}
