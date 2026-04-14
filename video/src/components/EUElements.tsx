import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { eu } from "../euTheme";

// ─── Documentary overlays ───────────────────────────────────────────────────

export const DocGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 12;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: 0.05,
        mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${seed}'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")`,
        backgroundSize: "300px 300px",
      }}
    />
  );
};

export const DocVignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.70) 100%)",
    }}
  />
);

// Soft moving spotlight — very subtle documentary vibe
export const DocSpot: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 5400], [-10, 110]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: `${x}%`,
          width: "60%",
          height: "160%",
          background: `radial-gradient(ellipse at center, ${eu.accentSoft} 0%, rgba(0,0,0,0) 70%)`,
          filter: "blur(100px)",
          opacity: 0.4,
          transform: "rotate(-6deg)",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── EU flag (12 stars on blue) ─────────────────────────────────────────────

export const EUFlag: React.FC<{ size?: number; waveFrame?: number }> = ({
  size = 300,
  waveFrame = 0,
}) => {
  const stars = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const r = size * 0.32;
    const cx = size / 2 + Math.cos(angle) * r;
    const cy = size / 2 + Math.sin(angle) * r;
    const twinkle =
      0.75 + Math.sin(waveFrame * 0.08 + i * 0.5) * 0.25;
    return { cx, cy, twinkle };
  });
  return (
    <svg
      width={size}
      height={size * 0.67}
      viewBox={`0 0 ${size} ${size * 0.67}`}
      style={{ display: "block" }}
    >
      <rect
        width={size}
        height={size * 0.67}
        fill={eu.euBlue}
        rx={6}
      />
      {stars.map((s, i) => (
        <Star
          key={i}
          cx={s.cx}
          cy={s.cy - size * 0.17}
          size={size * 0.04}
          color={eu.euGold}
          opacity={s.twinkle}
        />
      ))}
    </svg>
  );
};

const Star: React.FC<{
  cx: number;
  cy: number;
  size: number;
  color: string;
  opacity?: number;
}> = ({ cx, cy, size, color, opacity = 1 }) => {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : size / 2.5;
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    points.push(`${x},${y}`);
  }
  return <polygon points={points.join(" ")} fill={color} opacity={opacity} />;
};

// ─── German flag ────────────────────────────────────────────────────────────

export const GermanFlag: React.FC<{ width?: number }> = ({ width = 240 }) => (
  <div
    style={{
      width,
      height: width * 0.6,
      borderRadius: 6,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    }}
  >
    <div style={{ flex: 1, backgroundColor: eu.deBlack }} />
    <div style={{ flex: 1, backgroundColor: eu.deRed }} />
    <div style={{ flex: 1, backgroundColor: eu.deGold }} />
  </div>
);

// ─── Abstract Europe map — dotted grid forming a stylized continent ─────────

export const EUMap: React.FC<{
  width?: number;
  highlightGermany?: boolean;
  highlightAll?: boolean;
  frame?: number;
}> = ({ width = 900, highlightGermany = false, highlightAll = false, frame = 0 }) => {
  // Very rough country centers (0–100 on both axes) for dot placement
  const countries = [
    { id: "DE", x: 52, y: 38, size: 5.5, name: "DE" },
    { id: "FR", x: 42, y: 52, size: 5.5 },
    { id: "ES", x: 32, y: 66, size: 5 },
    { id: "PT", x: 24, y: 66, size: 3 },
    { id: "IT", x: 52, y: 62, size: 5 },
    { id: "NL", x: 46, y: 34, size: 2.5 },
    { id: "BE", x: 44, y: 40, size: 2.3 },
    { id: "LU", x: 46, y: 42, size: 1.5 },
    { id: "AT", x: 56, y: 48, size: 3 },
    { id: "CH", x: 50, y: 48, size: 2.5 },
    { id: "DK", x: 52, y: 28, size: 2.5 },
    { id: "SE", x: 56, y: 18, size: 4.5 },
    { id: "FI", x: 64, y: 16, size: 4.5 },
    { id: "NO", x: 52, y: 18, size: 4 },
    { id: "PL", x: 60, y: 36, size: 4.5 },
    { id: "CZ", x: 56, y: 42, size: 3 },
    { id: "SK", x: 60, y: 44, size: 2.5 },
    { id: "HU", x: 60, y: 48, size: 3 },
    { id: "RO", x: 66, y: 50, size: 4 },
    { id: "BG", x: 66, y: 56, size: 3 },
    { id: "GR", x: 62, y: 64, size: 3 },
    { id: "HR", x: 58, y: 52, size: 2.5 },
    { id: "SI", x: 56, y: 50, size: 2 },
    { id: "EE", x: 64, y: 26, size: 2 },
    { id: "LV", x: 64, y: 30, size: 2.2 },
    { id: "LT", x: 62, y: 32, size: 2.2 },
    { id: "IE", x: 32, y: 36, size: 2.8 },
    { id: "UK", x: 38, y: 32, size: 4 },
    { id: "CY", x: 74, y: 68, size: 1.8 },
    { id: "MT", x: 54, y: 70, size: 1 },
  ];

  const height = width * 0.7;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 70"
      style={{ display: "block" }}
    >
      {/* Background grid */}
      {Array.from({ length: 20 }).map((_, i) =>
        Array.from({ length: 14 }).map((__, j) => (
          <circle
            key={`${i}-${j}`}
            cx={i * 5 + 2.5}
            cy={j * 5 + 2.5}
            r={0.3}
            fill={eu.border}
          />
        ))
      )}

      {countries.map((c, i) => {
        const isGermany = c.id === "DE";
        const highlighted = highlightAll || (highlightGermany && isGermany);
        const appearDelay = highlightAll ? i * 1.5 : 0;
        const appear = interpolate(
          frame,
          [appearDelay, appearDelay + 10],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const baseColor = highlighted
          ? isGermany
            ? eu.euGold
            : eu.euBlueLight
          : eu.textDim;
        return (
          <g key={c.id} opacity={appear}>
            <circle
              cx={c.x}
              cy={c.y}
              r={c.size * 0.9}
              fill={baseColor}
              opacity={highlighted ? 0.95 : 0.4}
            />
            {isGermany && highlightGermany && (
              <circle
                cx={c.x}
                cy={c.y}
                r={c.size * 1.8}
                fill="none"
                stroke={eu.euGold}
                strokeWidth={0.4}
                opacity={0.6 + Math.sin(frame * 0.1) * 0.3}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ─── Simple euro symbol (animated) ──────────────────────────────────────────

export const EuroSymbol: React.FC<{
  size?: number;
  color?: string;
}> = ({ size = 80, color = eu.euGold }) => (
  <div
    style={{
      fontSize: size,
      fontWeight: 800,
      color,
      lineHeight: 1,
      textShadow: `0 0 30px ${color}66`,
      fontFamily: eu.font,
    }}
  >
    €
  </div>
);

// ─── Scene title card (used as consistent typography for chapters) ─────────

export const SceneTitle: React.FC<{
  kicker?: string;
  title: string;
  subtitle?: string;
  kickerColor?: string;
  isPortrait?: boolean;
  align?: "left" | "center";
}> = ({
  kicker,
  title,
  subtitle,
  kickerColor = eu.accent,
  isPortrait = false,
  align = "center",
}) => (
  <div style={{ textAlign: align, padding: isPortrait ? "0 40px" : "0 100px" }}>
    {kicker && (
      <div
        style={{
          fontSize: isPortrait ? 16 : 18,
          color: kickerColor,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        {kicker}
      </div>
    )}
    <div
      style={{
        fontSize: isPortrait ? 56 : 84,
        fontWeight: 800,
        color: eu.textPrimary,
        lineHeight: 1.05,
        letterSpacing: -2.5,
        marginBottom: subtitle ? 24 : 0,
      }}
    >
      {title}
    </div>
    {subtitle && (
      <div
        style={{
          fontSize: isPortrait ? 22 : 28,
          color: eu.textMuted,
          fontWeight: 400,
          lineHeight: 1.4,
          maxWidth: 1100,
          margin: align === "center" ? "0 auto" : undefined,
        }}
      >
        {subtitle}
      </div>
    )}
  </div>
);

// ─── Lower-third factual text (documentary style) ──────────────────────────

export const LowerThird: React.FC<{
  label: string;
  text: string;
  opacity?: number;
}> = ({ label, text, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: 80,
      bottom: 80,
      opacity,
      maxWidth: 700,
    }}
  >
    <div
      style={{
        fontSize: 14,
        color: eu.euGold,
        fontWeight: 700,
        letterSpacing: 2.5,
        textTransform: "uppercase",
        marginBottom: 10,
        paddingLeft: 16,
        borderLeft: `3px solid ${eu.euGold}`,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 24,
        color: eu.textPrimary,
        fontWeight: 600,
        lineHeight: 1.35,
        paddingLeft: 19,
      }}
    >
      {text}
    </div>
  </div>
);

// ─── Stat tile ──────────────────────────────────────────────────────────────

export const StatTile: React.FC<{
  value: string;
  label: string;
  color?: string;
  opacity?: number;
  scale?: number;
  translateY?: number;
}> = ({
  value,
  label,
  color = eu.accent,
  opacity = 1,
  scale = 1,
  translateY = 0,
}) => (
  <div
    style={{
      backgroundColor: eu.surface,
      border: `1px solid ${eu.border}`,
      borderRadius: 16,
      padding: "28px 36px",
      minWidth: 260,
      opacity,
      transform: `translateY(${translateY}px) scale(${scale})`,
      boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
    }}
  >
    <div
      style={{
        fontSize: 64,
        fontWeight: 900,
        color,
        lineHeight: 1,
        letterSpacing: -2,
        fontVariantNumeric: "tabular-nums",
        marginBottom: 10,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: 14,
        color: eu.textMuted,
        fontWeight: 600,
        letterSpacing: 1.5,
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  </div>
);
