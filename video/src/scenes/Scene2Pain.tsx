import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";

// Scene 2 — Pain point
// Avatar grid representing visitors. Most "bounce" (fade + shrink),
// a couple stay as highlighted dots.
// Stat badge counts up to 94% bounce rate.
// Main text: "Menschen entscheiden in Sekunden."
export const Scene2Pain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;

  // Stat counter
  const pct = Math.round(
    interpolate(frame, [4, 34], [0, 94], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const statOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const statY = spring({
    frame,
    fps,
    from: -40,
    to: 0,
    config: { damping: 200 },
  });

  // Main text
  const textOpacity = interpolate(frame, [22, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [22, 36], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Visitor grid layout
  const cols = isPortrait ? 8 : 14;
  const rows = isPortrait ? 4 : 3;
  const total = cols * rows;

  const gridOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: isPortrait ? 60 : 120,
      }}
    >
      {/* Visitor grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: isPortrait ? 16 : 20,
          marginBottom: isPortrait ? 70 : 90,
          opacity: gridOpacity,
        }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const stays = random(`stay-${i}`) > 0.92;
          const appearDelay = random(`appear-${i}`) * 8;
          const bounceDelay = 14 + random(`bounce-${i}`) * 16;

          const appear = interpolate(
            frame - appearDelay,
            [0, 6],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }
          );

          const bounceProgress = stays
            ? 0
            : interpolate(frame - bounceDelay, [0, 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

          const opacity = appear * (1 - bounceProgress * 0.92);
          const scale = 1 - bounceProgress * 0.35;

          return (
            <div
              key={i}
              style={{
                width: isPortrait ? 56 : 64,
                height: isPortrait ? 56 : 64,
                borderRadius: "50%",
                backgroundColor: stays ? theme.accent : "#3A3A42",
                opacity,
                transform: `scale(${scale})`,
                boxShadow: stays ? `0 0 28px ${theme.accentGlow}` : "none",
              }}
            />
          );
        })}
      </div>

      {/* Main text */}
      <h2
        style={{
          fontSize: isPortrait ? 80 : 104,
          fontWeight: 900,
          color: theme.textPrimary,
          margin: 0,
          textAlign: "center",
          letterSpacing: -2.5,
          lineHeight: 1.02,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          maxWidth: isPortrait ? 960 : 1600,
        }}
      >
        Menschen entscheiden
        <br />
        in <span style={{ color: theme.accent }}>Sekunden</span>.
      </h2>

      {/* Stat badge */}
      <div
        style={{
          position: "absolute",
          top: isPortrait ? 130 : 80,
          right: isPortrait ? 60 : 120,
          opacity: statOpacity,
          transform: `translateY(${statY}px)`,
          padding: "16px 24px",
          backgroundColor: theme.surface,
          border: `1px solid ${theme.borderStrong}`,
          borderRadius: 18,
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        }}
      >
        <span
          style={{
            fontSize: isPortrait ? 52 : 60,
            fontWeight: 900,
            color: theme.warning,
            letterSpacing: -2,
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {pct}%
        </span>
        <span
          style={{
            fontSize: isPortrait ? 16 : 20,
            color: theme.textMuted,
            fontWeight: 500,
            letterSpacing: 0.3,
          }}
        >
          verlassen
          <br />
          die Seite
        </span>
      </div>
    </AbsoluteFill>
  );
};
