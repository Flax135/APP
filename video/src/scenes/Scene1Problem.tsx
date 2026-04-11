import React from "react";
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { BrowserFrame } from "../components/BrowserFrame";
import { OldSiteMock } from "../components/SiteMocks";

// Scene 1 — Hook
// 0–10:  old website on screen (full glimpse)
// 10–14: fast zoom + fade out
// 12–22: text slams in (scale 1.8 → 1, blur 14 → 0, opacity 0 → 1)
// 26–38: "kostet" highlighted red with underline sweep
// 40–75: gentle drift, holds
export const Scene1Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;

  // Old website zoom + fade
  const oldScale = interpolate(frame, [0, 14], [1, 2.6], {
    extrapolateRight: "clamp",
  });
  const oldOpacity = interpolate(frame, [0, 8, 14], [1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const oldBlur = interpolate(frame, [0, 14], [0, 22], {
    extrapolateRight: "clamp",
  });

  // Text slam
  const textScale = interpolate(frame, [10, 22], [1.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textOpacity = interpolate(frame, [10, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textBlur = interpolate(frame, [10, 22], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "kostet" highlight
  const highlight = interpolate(frame, [26, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const kostetColor = interpolateColors(
    highlight,
    [0, 1],
    [theme.textPrimary, theme.warning]
  );

  // Underline sweep
  const underline = interpolate(frame, [28, 46], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slow drift during hold
  const drift = interpolate(frame, [40, 75], [0, -8]);
  const scaleHold = interpolate(frame, [40, 75], [1, 1.02]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Old site glimpse */}
      {oldOpacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            transform: `scale(${oldScale})`,
            opacity: oldOpacity,
            filter: `blur(${oldBlur}px)`,
          }}
        >
          <BrowserFrame
            old
            url="mein-geschaeft.de"
            width={isPortrait ? 780 : 1200}
            height={isPortrait ? 520 : 720}
          >
            <OldSiteMock />
          </BrowserFrame>
        </div>
      )}

      {/* Main text */}
      <div
        style={{
          position: "relative",
          transform: `translateY(${drift}px) scale(${textScale * scaleHold})`,
          opacity: textOpacity,
          filter: `blur(${textBlur}px)`,
          textAlign: "center",
          padding: isPortrait ? "0 60px" : "0 140px",
        }}
      >
        <h1
          style={{
            fontSize: isPortrait ? 96 : 128,
            fontWeight: 900,
            color: theme.textPrimary,
            margin: 0,
            lineHeight: 1.02,
            letterSpacing: -3,
            textShadow: "0 20px 80px rgba(0,0,0,0.9)",
          }}
        >
          Deine Website{" "}
          <span
            style={{
              color: kostetColor,
              position: "relative",
              display: "inline-block",
            }}
          >
            kostet
            <span
              style={{
                position: "absolute",
                left: 0,
                bottom: -10,
                height: 6,
                width: `${underline}%`,
                background: `linear-gradient(90deg, ${theme.warning}, #FF8A8D)`,
                borderRadius: 3,
                boxShadow: `0 0 20px ${theme.warning}`,
              }}
            />
          </span>
          <br />
          dich Kunden.
        </h1>
      </div>
    </AbsoluteFill>
  );
};
