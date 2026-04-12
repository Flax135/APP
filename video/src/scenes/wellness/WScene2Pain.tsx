import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { wt } from "../../wellnessTheme";

// Scene 2 — Pain point (75–150 frames, 2.5 s)
// "80 % der Kunden buchen online." + "Was sehen sie bei dir?"
// A grid of booking icons — most fade out to show lost potential.
export const WScene2Pain: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;

  // Counter 0 → 80
  const count = Math.round(
    interpolate(frame, [0, 30], [0, 80], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Headline text
  const headlineOpacity = interpolate(frame, [6, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame, [6, 22], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sub-question
  const subOpacity = interpolate(frame, [32, 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [32, 46], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Booking grid — 80 % stay, 20 % fade out
  const cols = isPortrait ? 6 : 10;
  const rows = isPortrait ? 4 : 3;
  const total = cols * rows;
  const keepCount = Math.round(total * 0.8);

  const gridOpacity = interpolate(frame, [4, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Fading of the "lost" items
  const lostFade = interpolate(frame, [36, 54], [1, 0.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: isPortrait ? 50 : 80,
        flexDirection: "column",
        gap: isPortrait ? 36 : 32,
      }}
    >
      {/* Big counter */}
      <div
        style={{
          fontSize: isPortrait ? 120 : 140,
          fontWeight: 900,
          color: wt.accent,
          lineHeight: 1,
          letterSpacing: -4,
          fontVariantNumeric: "tabular-nums",
          opacity: headlineOpacity,
        }}
      >
        {count} %
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: isPortrait ? 38 : 48,
          fontWeight: 600,
          color: wt.textPrimary,
          textAlign: "center",
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          letterSpacing: -1,
          lineHeight: 1.15,
        }}
      >
        der Kunden buchen{" "}
        <span style={{ color: wt.accent, fontWeight: 800 }}>online</span>.
      </div>

      {/* Booking grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: isPortrait ? 8 : 10,
          opacity: gridOpacity,
          maxWidth: isPortrait ? 460 : 700,
        }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const isKept = i < keepCount;
          return (
            <div
              key={i}
              style={{
                width: isPortrait ? 22 : 24,
                height: isPortrait ? 22 : 24,
                borderRadius: 6,
                backgroundColor: isKept ? wt.accent : wt.surfaceHi,
                opacity: isKept ? 1 : lostFade,
                transition: "opacity 0.3s",
              }}
            />
          );
        })}
      </div>

      {/* Sub-question */}
      <div
        style={{
          fontSize: isPortrait ? 30 : 38,
          fontWeight: 400,
          color: wt.textMuted,
          textAlign: "center",
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          letterSpacing: -0.5,
          fontStyle: "italic",
        }}
      >
        Was sehen sie bei dir?
      </div>
    </AbsoluteFill>
  );
};
