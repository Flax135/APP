import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { BrowserFrame } from "../components/BrowserFrame";
import { PhoneFrame } from "../components/PhoneFrame";
import { ModernHeroMock, OldSiteMock } from "../components/SiteMocks";

// Scene 3 — Transition from problem → solution
// Old site dissolves while new modern site scales up.
// Phone frame slides in from the right with mobile view.
// Load speed badge appears above the new site.
export const Scene3Transition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;

  // Old site collapses
  const oldOpacity = interpolate(frame, [0, 22], [1, 0], {
    extrapolateRight: "clamp",
  });
  const oldScale = interpolate(frame, [0, 28], [1, 0.72], {
    extrapolateRight: "clamp",
  });
  const oldRotate = interpolate(frame, [0, 28], [0, -6]);
  const oldBlur = interpolate(frame, [0, 28], [0, 22]);

  // New site rises
  const newY = spring({
    frame: frame - 20,
    fps,
    from: 80,
    to: 0,
    config: { damping: 14, stiffness: 90 },
  });
  const newOpacity = interpolate(frame, [22, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const newScale = interpolate(frame, [22, 55], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phone slide-in
  const phoneX = spring({
    frame: frame - 48,
    fps,
    from: isPortrait ? 500 : 700,
    to: 0,
    config: { damping: 18, stiffness: 80 },
  });
  const phoneOpacity = interpolate(frame, [48, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Text
  const textOpacity = interpolate(frame, [28, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [28, 50], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Load speed badge
  const loadOpacity = interpolate(frame, [54, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const loadY = interpolate(frame, [54, 72], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const browserW = isPortrait ? 880 : 1120;
  const browserH = isPortrait ? 560 : 680;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* Text above */}
      <div
        style={{
          position: "absolute",
          top: isPortrait ? 160 : 90,
          left: 0,
          right: 0,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <h2
          style={{
            fontSize: isPortrait ? 68 : 84,
            fontWeight: 800,
            color: theme.textPrimary,
            margin: 0,
            letterSpacing: -2,
            lineHeight: 1.08,
            maxWidth: isPortrait ? 900 : 1500,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Was wäre, wenn deine Website
          <br />
          <span style={{ color: theme.accent }}>für dich arbeitet?</span>
        </h2>
      </div>

      {/* Stage */}
      <div
        style={{
          position: "relative",
          marginTop: isPortrait ? 260 : 120,
        }}
      >
        {/* Old site vanishing */}
        {oldOpacity > 0.01 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) scale(${oldScale}) rotate(${oldRotate}deg)`,
              opacity: oldOpacity,
              filter: `blur(${oldBlur}px)`,
              pointerEvents: "none",
            }}
          >
            <BrowserFrame old url="alte-seite.de" width={browserW} height={browserH}>
              <OldSiteMock />
            </BrowserFrame>
          </div>
        )}

        {/* New site rising */}
        <div
          style={{
            transform: `translateY(${newY}px) scale(${newScale})`,
            opacity: newOpacity,
            transformOrigin: "center",
          }}
        >
          <BrowserFrame url="flaxdesigning.de" width={browserW} height={browserH}>
            <ModernHeroMock frame={frame} />
          </BrowserFrame>
        </div>

        {/* Phone with mobile view */}
        <div
          style={{
            position: "absolute",
            right: isPortrait ? -40 : -200,
            bottom: isPortrait ? -100 : -140,
            transform: `translateX(${phoneX}px)`,
            opacity: phoneOpacity,
          }}
        >
          <PhoneFrame
            width={isPortrait ? 230 : 280}
            height={isPortrait ? 480 : 580}
          >
            <ModernHeroMock frame={frame} mobile />
          </PhoneFrame>
        </div>

        {/* Load speed badge */}
        <div
          style={{
            position: "absolute",
            top: -44,
            left: "50%",
            transform: `translate(-50%, ${loadY}px)`,
            opacity: loadOpacity,
            padding: "12px 20px",
            backgroundColor: theme.accentSoft,
            border: `1px solid ${theme.accent}`,
            borderRadius: 999,
            color: theme.accent,
            fontWeight: 700,
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: `0 10px 30px ${theme.accentSoft}`,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 20 }}>⚡</span>
          <span>Geladen in 0.2s</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
