import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { wt } from "../../wellnessTheme";

// Scene 5 — Results (420–540 frames, 4 s)
// Three stat cards with counting numbers + sequential word reveal.
export const WScene5Results: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;

  // Animated counters
  const bookings = Math.round(
    interpolate(frame, [10, 60], [0, 180], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const visitors = Math.round(
    interpolate(frame, [15, 65], [0, 4200], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const satisfaction = Math.round(
    interpolate(frame, [20, 70], [0, 98], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Card entrance spring
  const cardAppear = (delay: number) =>
    spring({
      frame: frame - delay,
      fps,
      from: 0,
      to: 1,
      config: { damping: 16, stiffness: 80 },
    });

  // Sequential word reveal
  const word1 = interpolate(frame, [66, 76], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const word2 = interpolate(frame, [76, 86], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const word3 = interpolate(frame, [86, 96], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: isPortrait ? 50 : 80,
      }}
    >
      {/* Stat cards */}
      <div
        style={{
          display: "flex",
          flexDirection: isPortrait ? "column" : "row",
          gap: isPortrait ? 20 : 32,
          marginBottom: isPortrait ? 56 : 72,
        }}
      >
        <StatCard
          label="Buchungen"
          value={`+${bookings} %`}
          color={wt.accent}
          appear={cardAppear(0)}
          isPortrait={isPortrait}
        />
        <StatCard
          label="Besucher / Monat"
          value={visitors.toLocaleString("de-DE")}
          color={wt.textPrimary}
          appear={cardAppear(8)}
          isPortrait={isPortrait}
        />
        <StatCard
          label="Zufriedenheit"
          value={`${satisfaction} %`}
          color={wt.accent}
          appear={cardAppear(16)}
          isPortrait={isPortrait}
        />
      </div>

      {/* Headline */}
      <div
        style={{
          display: "flex",
          gap: isPortrait ? 0 : 20,
          flexDirection: isPortrait ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <WordReveal
          text="Mehr Buchungen."
          appear={word1}
          isPortrait={isPortrait}
        />
        <WordReveal
          text="Mehr Vertrauen."
          appear={word2}
          isPortrait={isPortrait}
        />
        <WordReveal
          text="Mehr Kunden."
          appear={word3}
          isPortrait={isPortrait}
          highlight
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------- Sub-components ----------

const StatCard: React.FC<{
  label: string;
  value: string;
  color: string;
  appear: number;
  isPortrait: boolean;
}> = ({ label, value, color, appear, isPortrait }) => (
  <div
    style={{
      backgroundColor: "#fff",
      border: `1px solid ${wt.border}`,
      borderRadius: 22,
      padding: isPortrait ? "24px 32px" : "30px 42px",
      minWidth: isPortrait ? 360 : 320,
      opacity: appear,
      transform: `translateY(${(1 - appear) * 30}px) scale(${
        0.92 + appear * 0.08
      })`,
      boxShadow: "0 20px 60px rgba(61,49,35,0.08)",
    }}
  >
    <div
      style={{
        fontSize: isPortrait ? 13 : 14,
        color: wt.textMuted,
        fontWeight: 600,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 1.2,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: isPortrait ? 52 : 60,
        fontWeight: 900,
        color,
        lineHeight: 1,
        letterSpacing: -2,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </div>
  </div>
);

const WordReveal: React.FC<{
  text: string;
  appear: number;
  isPortrait: boolean;
  highlight?: boolean;
}> = ({ text, appear, isPortrait, highlight }) => (
  <div
    style={{
      fontSize: isPortrait ? 46 : 56,
      fontWeight: highlight ? 800 : 600,
      color: highlight ? wt.accent : wt.textPrimary,
      letterSpacing: -1.5,
      lineHeight: 1.15,
      opacity: appear,
      transform: `translateY(${(1 - appear) * 18}px)`,
      padding: isPortrait ? "3px 0" : "0 4px",
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);
