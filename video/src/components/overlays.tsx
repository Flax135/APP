import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

// Subtle film grain — shifts per frame for organic motion
export const GrainOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 10;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: 0.08,
        mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' seed='${seed}'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")`,
        backgroundSize: "300px 300px",
      }}
    />
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.65) 100%)",
    }}
  />
);

// Slow cinematic light sweep across the whole ad
export const LightBeam: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 660], [-30, 130]);
  const opacity = interpolate(
    frame,
    [0, 90, 540, 660],
    [0, 0.18, 0.18, 0],
    { extrapolateRight: "clamp" }
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: `${x}%`,
          width: "45%",
          height: "140%",
          background: `radial-gradient(ellipse at center, ${theme.accentSoft} 0%, rgba(0,0,0,0) 70%)`,
          filter: "blur(60px)",
          opacity,
          transform: "rotate(-12deg)",
        }}
      />
    </AbsoluteFill>
  );
};
