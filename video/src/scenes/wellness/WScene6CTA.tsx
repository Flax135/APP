import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { wt } from "../../wellnessTheme";
import { WellnessFlaxLogo } from "../../components/WellnessLogo";

// Scene 6 — CTA (540–660 frames, 4 s)
// Tagline, logo, pricing badges, CTA button.
export const WScene6CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;

  // Tagline
  const taglineOpacity = interpolate(frame, [2, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [2, 22], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Logo
  const logoScale = spring({
    frame: frame - 14,
    fps,
    from: 0.88,
    to: 1,
    config: { damping: 18, stiffness: 70 },
  });
  const logoOpacity = interpolate(frame, [14, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Golden underline sweep
  const lineWidth = interpolate(frame, [26, 56], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Price badge (ab 250 €)
  const priceAppear = spring({
    frame: frame - 44,
    fps,
    from: 0,
    to: 1,
    config: { damping: 16, stiffness: 80 },
  });

  // Free offer badge
  const freeAppear = spring({
    frame: frame - 54,
    fps,
    from: 0,
    to: 1,
    config: { damping: 16, stiffness: 80 },
  });

  // CTA button
  const btnScale = spring({
    frame: frame - 66,
    fps,
    from: 0,
    to: 1,
    config: { damping: 16, stiffness: 80 },
  });

  // Gentle breathing
  const breathing = 1 + Math.sin((frame - 80) * 0.07) * 0.004;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      {/* Tagline */}
      <div
        style={{
          fontSize: isPortrait ? 48 : 62,
          fontWeight: 300,
          color: wt.textPrimary,
          textAlign: "center",
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          letterSpacing: -1.5,
          lineHeight: 1.12,
          marginBottom: isPortrait ? 48 : 44,
          maxWidth: isPortrait ? 920 : 1400,
        }}
      >
        Dein neuer{" "}
        <span style={{ fontWeight: 700, color: wt.accent }}>
          Online-Auftritt
        </span>{" "}
        wartet.
      </div>

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale * breathing})`,
          marginBottom: 16,
        }}
      >
        <WellnessFlaxLogo scale={isPortrait ? 1.1 : 1.35} />
      </div>

      {/* Golden underline */}
      <div
        style={{
          width: isPortrait ? 280 : 380,
          height: 2,
          backgroundColor: wt.border,
          marginTop: 12,
          marginBottom: 32,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${lineWidth}%`,
            background: `linear-gradient(90deg, ${wt.accent}, ${wt.accentAlt})`,
          }}
        />
      </div>

      {/* Price + Free offer badges */}
      <div
        style={{
          display: "flex",
          flexDirection: isPortrait ? "column" : "row",
          gap: isPortrait ? 14 : 20,
          marginBottom: isPortrait ? 32 : 28,
          alignItems: "center",
        }}
      >
        {/* Ab 250 € */}
        <div
          style={{
            opacity: priceAppear,
            transform: `translateY(${(1 - priceAppear) * 16}px) scale(${
              0.92 + priceAppear * 0.08
            })`,
            padding: "14px 24px",
            backgroundColor: "#fff",
            border: `1px solid ${wt.borderStrong}`,
            borderRadius: 999,
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            boxShadow: "0 12px 40px rgba(61,49,35,0.08)",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: wt.textMuted,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Websites
          </span>
          <span
            style={{
              fontSize: 22,
              color: wt.textPrimary,
              fontWeight: 900,
              letterSpacing: -0.5,
            }}
          >
            ab 250 €
          </span>
        </div>

        {/* Angebot kostenlos */}
        <div
          style={{
            opacity: freeAppear,
            transform: `translateY(${(1 - freeAppear) * 16}px) scale(${
              0.92 + freeAppear * 0.08
            })`,
            padding: "14px 24px",
            backgroundColor: wt.accentSoft,
            border: `1px solid ${wt.accent}`,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: `0 12px 40px ${wt.accentSoft}`,
          }}
        >
          <span style={{ fontSize: 16 }}>✦</span>
          <span
            style={{
              fontSize: 19,
              color: wt.accent,
              fontWeight: 800,
              letterSpacing: -0.3,
            }}
          >
            Angebot kostenlos
          </span>
        </div>
      </div>

      {/* CTA button */}
      <div
        style={{
          transform: `scale(${btnScale})`,
          opacity: btnScale,
          padding: isPortrait ? "18px 38px" : "20px 42px",
          backgroundColor: wt.accent,
          color: "#fff",
          borderRadius: 999,
          fontWeight: 800,
          fontSize: isPortrait ? 20 : 22,
          letterSpacing: -0.3,
          boxShadow: `0 16px 48px ${wt.accentGlow}`,
        }}
      >
        flaxdesigning.de →
      </div>
    </AbsoluteFill>
  );
};
