import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { wt } from "../wellnessTheme";

// Very subtle warm grain — softer than the dark-theme grain
export const WarmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 10;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: 0.035,
        mixBlendMode: "multiply",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='${seed}'/><feColorMatrix values='0 0 0 0 0.4 0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0.5 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")`,
        backgroundSize: "300px 300px",
      }}
    />
  );
};

// Warm vignette — soft beige edges instead of black
export const WarmVignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse at center, rgba(250,246,241,0) 40%, rgba(229,221,211,0.65) 100%)",
    }}
  />
);

// Slow golden light sweep across the entire ad
export const GoldenGlow: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 660], [-20, 120]);
  const opacity = interpolate(
    frame,
    [0, 60, 540, 660],
    [0, 0.22, 0.22, 0],
    { extrapolateRight: "clamp" }
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: `${x}%`,
          width: "50%",
          height: "160%",
          background: `radial-gradient(ellipse at center, ${wt.accentSoft} 0%, rgba(250,246,241,0) 65%)`,
          filter: "blur(80px)",
          opacity,
          transform: "rotate(-8deg)",
        }}
      />
    </AbsoluteFill>
  );
};
