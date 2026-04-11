import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { FlaxLogo } from "../components/FlaxLogo";

// Scene 6 — Call to action
// Tagline, logo, pricing badge, CTA button, website.
// Includes "ab 250 €" and "Angebot kostenlos" messaging.
export const Scene6CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;

  // Tagline
  const taglineOpacity = interpolate(frame, [2, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [2, 22], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Logo
  const logoScale = spring({
    frame: frame - 14,
    fps,
    from: 0.85,
    to: 1,
    config: { damping: 14, stiffness: 90 },
  });
  const logoOpacity = interpolate(frame, [14, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Underline sweep
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
    config: { damping: 14, stiffness: 90 },
  });

  // Free offer badge
  const freeAppear = spring({
    frame: frame - 54,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, stiffness: 90 },
  });

  // CTA button
  const btnScale = spring({
    frame: frame - 66,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, stiffness: 90 },
  });

  // Gentle breathing on the final held image
  const breathing = 1 + Math.sin((frame - 80) * 0.08) * 0.006;

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
          fontSize: isPortrait ? 52 : 68,
          fontWeight: 800,
          color: theme.textPrimary,
          textAlign: "center",
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          letterSpacing: -2,
          lineHeight: 1.08,
          marginBottom: isPortrait ? 56 : 48,
          maxWidth: isPortrait ? 960 : 1500,
        }}
      >
        Bring dein Business
        <br />
        auf das <span style={{ color: theme.accent }}>nächste Level</span>.
      </div>

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale * breathing})`,
          marginBottom: 18,
        }}
      >
        <FlaxLogo scale={isPortrait ? 1.15 : 1.4} />
      </div>

      {/* Underline sweep */}
      <div
        style={{
          width: isPortrait ? 300 : 400,
          height: 2,
          backgroundColor: theme.border,
          marginTop: 14,
          marginBottom: 34,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${lineWidth}%`,
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentAlt})`,
            boxShadow: `0 0 20px ${theme.accent}`,
          }}
        />
      </div>

      {/* Price + Free offer badges */}
      <div
        style={{
          display: "flex",
          flexDirection: isPortrait ? "column" : "row",
          gap: isPortrait ? 16 : 22,
          marginBottom: isPortrait ? 36 : 32,
          alignItems: "center",
        }}
      >
        {/* Ab 250 € */}
        <div
          style={{
            opacity: priceAppear,
            transform: `translateY(${(1 - priceAppear) * 20}px) scale(${
              0.9 + priceAppear * 0.1
            })`,
            padding: "14px 24px",
            backgroundColor: theme.surface,
            border: `1px solid ${theme.borderStrong}`,
            borderRadius: 999,
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: theme.textMuted,
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
              color: theme.textPrimary,
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
            transform: `translateY(${(1 - freeAppear) * 20}px) scale(${
              0.9 + freeAppear * 0.1
            })`,
            padding: "14px 24px",
            backgroundColor: theme.accentSoft,
            border: `1px solid ${theme.accent}`,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: `0 20px 60px ${theme.accentSoft}`,
          }}
        >
          <span style={{ fontSize: 18 }}>✦</span>
          <span
            style={{
              fontSize: 20,
              color: theme.accent,
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
          padding: isPortrait ? "20px 40px" : "22px 44px",
          backgroundColor: theme.accent,
          color: theme.bg,
          borderRadius: 999,
          fontWeight: 900,
          fontSize: isPortrait ? 22 : 24,
          letterSpacing: -0.4,
          boxShadow: `0 20px 60px ${theme.accentGlow}, 0 0 40px ${theme.accentSoft}`,
        }}
      >
        flaxdesigning.de →
      </div>
    </AbsoluteFill>
  );
};
