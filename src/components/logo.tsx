import Svg, { Circle, Line, Path, Text, TSpan, Marker, Defs } from 'react-native-svg';

type Props = {
  width?: number;
  height?: number;
};

export function Logo({ width = 340, height = 160 }: Props) {
  const scale = width / 680;
  return (
    <Svg width={width} height={height} viewBox="0 0 680 320">
      <Defs>
        <Marker id="arrC" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <Path d="M2 1L8 5L2 9" fill="none" stroke="#e8d5b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Marker>
        <Marker id="arrD" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <Path d="M2 1L8 5L2 9" fill="none" stroke="#e8d5b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Marker>
      </Defs>

      {/* Circle background */}
      <Circle cx="340" cy="148" r="90" fill="#1a1a2e"/>
      <Circle cx="340" cy="148" r="90" fill="none" stroke="#4ecca3" strokeWidth="3"/>

      {/* Hanger top */}
      <Line x1="340" y1="76" x2="340" y2="94" stroke="#4ecca3" strokeWidth="2.5" strokeLinecap="round"/>
      <Path d="M 340 94 Q 340 102 350 102 L 370 102 Q 378 102 378 110 Q 378 118 370 118 L 310 118 Q 302 118 302 110 Q 302 102 310 102 L 330 102 Q 340 102 340 94" fill="none" stroke="#4ecca3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="340" cy="76" r="4" fill="none" stroke="#4ecca3" strokeWidth="2.2"/>
      <Circle cx="340" cy="71" r="2" fill="#4ecca3"/>

      {/* Body left */}
      <Path d="M 304 118 L 300 138 Q 300 148 304 148 L 334 148 L 334 200 Q 334 204 326 204 L 308 204 Q 302 204 302 198 L 302 148" fill="none" stroke="#4ecca3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Body right */}
      <Path d="M 376 118 L 380 138 Q 380 148 376 148 L 346 148 L 346 200 Q 346 204 354 204 L 372 204 Q 378 204 378 198 L 378 148" fill="none" stroke="#4ecca3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Arrows */}
      <Path d="M 392 118 A 20 20 0 0 1 392 178" fill="none" stroke="#e8d5b7" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrC)"/>
      <Path d="M 288 178 A 20 20 0 0 1 288 118" fill="none" stroke="#e8d5b7" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrD)"/>

      {/* Text */}
      <Text x="340" y="272" textAnchor="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="38" fontWeight="700" letterSpacing="6" fill="#1a1a2e">
        Re<TSpan fill="#4ecca3">Wear</TSpan>
      </Text>
      <Text x="340" y="296" textAnchor="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="12" fontWeight="400" letterSpacing="4" fill="#888">
        second life for clothing
      </Text>
    </Svg>
  );
}
