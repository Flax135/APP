import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { wt } from "../../wellnessTheme";
import { LightBrowserFrame } from "../../components/WellnessFrames";
import { OldSalonMock } from "../../components/WellnessSiteMocks";

// Scene 1 — Hook (0–75 frames, 2.5 s)
// Calm, elegant opening.  Old salon site glimpse fades gently,
// then the headline drifts in with a golden underline.
export const WScene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;

  // Old salon site — gentle zoom + fade
  const oldScale = interpolate(frame, [0, 20], [1, 1.6], {
    extrapolateRight: "clamp",
  });
  const oldOpacity = interpolate(frame, [0, 12, 20], [0.85, 0.85, 0], {
    extrapolateRight: "clamp",
  });
  const oldBlur = interpolate(frame, [0, 20], [0, 10], {
    extrapolateRight: "clamp",
  });

  // Main text — gentle fade-in (no slam)
  const textOpacity = interpolate(frame, [16, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [16, 32], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Golden underline sweep under "ersten Eindruck"
  const underline = interpolate(frame, [34, 54], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Decorative circle
  const circleScale = interpolate(frame, [22, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const circleOpacity = interpolate(frame, [22, 44], [0, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gentle drift during hold
  const drift = interpolate(frame, [42, 75], [0, -4]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Old salon glimpse */}
      {oldOpacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            transform: `scale(${oldScale})`,
            opacity: oldOpacity,
            filter: `blur(${oldBlur}px)`,
          }}
        >
          <LightBrowserFrame
            old
            url="nagelstudio-sabine.de"
            width={isPortrait ? 700 : 1100}
            height={isPortrait ? 460 : 660}
          >
            <OldSalonMock />
          </LightBrowserFrame>
        </div>
      )}

      {/* Decorative circle */}
      <div
        style={{
          position: "absolute",
          width: isPortrait ? 380 : 480,
          height: isPortrait ? 380 : 480,
          borderRadius: "50%",
          border: `1px solid ${wt.accent}`,
          opacity: circleOpacity,
          transform: `scale(${circleScale})`,
          pointerEvents: "none",
        }}
      />

      {/* Main headline */}
      <div
        style={{
          position: "relative",
          transform: `translateY(${drift + textY}px)`,
          opacity: textOpacity,
          textAlign: "center",
          padding: isPortrait ? "0 50px" : "0 140px",
        }}
      >
        <h1
          style={{
            fontSize: isPortrait ? 74 : 98,
            fontWeight: 300,
            color: wt.textPrimary,
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: -2,
          }}
        >
          Schönheit beginnt
          <br />
          <span
            style={{
              fontWeight: 700,
              position: "relative",
              display: "inline-block",
            }}
          >
            mit dem ersten Eindruck
            <span
              style={{
                position: "absolute",
                left: 0,
                bottom: -4,
                height: 3,
                width: `${underline}%`,
                background: `linear-gradient(90deg, ${wt.accent}, ${wt.accentAlt})`,
                borderRadius: 2,
              }}
            />
          </span>
          .
        </h1>
      </div>
    </AbsoluteFill>
  );
};
