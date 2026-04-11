import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";

// Scene 5 — Results
// Three stat cards with counting numbers.
// Sequential word reveal: "Mehr Sichtbarkeit. Mehr Vertrauen. Mehr Umsatz."
export const Scene5Results: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;

  // Animated counters
  const conversions = Math.round(
    interpolate(frame, [10, 60], [0, 247], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const visitors = Math.round(
    interpolate(frame, [15, 65], [0, 12847], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const revenue = Math.round(
    interpolate(frame, [20, 70], [0, 48920], {
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
      config: { damping: 14, stiffness: 100 },
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
        padding: isPortrait ? 60 : 80,
      }}
    >
      {/* Stat cards */}
      <div
        style={{
          display: "flex",
          flexDirection: isPortrait ? "column" : "row",
          gap: isPortrait ? 24 : 36,
          marginBottom: isPortrait ? 60 : 80,
        }}
      >
        <StatCard
          label="Conversions"
          value={`+${conversions}%`}
          color={theme.accent}
          appear={cardAppear(0)}
          isPortrait={isPortrait}
          trend
        />
        <StatCard
          label="Besucher / Monat"
          value={visitors.toLocaleString("de-DE")}
          color={theme.textPrimary}
          appear={cardAppear(8)}
          isPortrait={isPortrait}
        />
        <StatCard
          label="Umsatz / Monat"
          value={`€ ${revenue.toLocaleString("de-DE")}`}
          color={theme.accent}
          appear={cardAppear(16)}
          isPortrait={isPortrait}
          trend
        />
      </div>

      {/* Headline */}
      <div
        style={{
          display: "flex",
          gap: isPortrait ? 0 : 24,
          flexDirection: isPortrait ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <WordReveal text="Mehr Sichtbarkeit." appear={word1} isPortrait={isPortrait} />
        <WordReveal text="Mehr Vertrauen." appear={word2} isPortrait={isPortrait} />
        <WordReveal text="Mehr Umsatz." appear={word3} isPortrait={isPortrait} highlight />
      </div>
    </AbsoluteFill>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string;
  color: string;
  appear: number;
  isPortrait: boolean;
  trend?: boolean;
}> = ({ label, value, color, appear, isPortrait, trend }) => {
  return (
    <div
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.borderStrong}`,
        borderRadius: 22,
        padding: isPortrait ? "26px 34px" : "34px 46px",
        minWidth: isPortrait ? 380 : 340,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 40}px) scale(${
          0.9 + appear * 0.1
        })`,
        boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          fontSize: isPortrait ? 13 : 15,
          color: theme.textMuted,
          fontWeight: 600,
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: isPortrait ? 58 : 66,
          fontWeight: 900,
          color,
          lineHeight: 1,
          letterSpacing: -2.5,
          fontVariantNumeric: "tabular-nums",
          display: "flex",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        {value}
        {trend && (
          <span
            style={{
              fontSize: isPortrait ? 26 : 30,
              color: theme.accent,
            }}
          >
            ↗
          </span>
        )}
      </div>
    </div>
  );
};

const WordReveal: React.FC<{
  text: string;
  appear: number;
  isPortrait: boolean;
  highlight?: boolean;
}> = ({ text, appear, isPortrait, highlight }) => (
  <div
    style={{
      fontSize: isPortrait ? 52 : 64,
      fontWeight: 900,
      color: highlight ? theme.accent : theme.textPrimary,
      letterSpacing: -2,
      lineHeight: 1.1,
      opacity: appear,
      transform: `translateY(${(1 - appear) * 24}px)`,
      padding: isPortrait ? "4px 0" : "0 4px",
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);
