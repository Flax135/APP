import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { wt } from "../../wellnessTheme";
import { LightBrowserFrame, LightPhoneFrame } from "../../components/WellnessFrames";
import { OldSalonMock, NailStudioMock } from "../../components/WellnessSiteMocks";

// Scene 3 — Transition (150–270 frames, 4 s)
// Old site gently dissolves, modern browser + phone mockup rise in.
export const WScene3Transition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;

  // Old site collapses (gentle blur + shrink + fade)
  const oldOpacity = interpolate(frame, [0, 30], [0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const oldScale = interpolate(frame, [0, 30], [0.85, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const oldBlur = interpolate(frame, [0, 30], [0, 14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Question text
  const questionOpacity = interpolate(frame, [10, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const questionFadeOut = interpolate(frame, [42, 54], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const questionY = interpolate(frame, [10, 28], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Modern browser appears
  const browserY = spring({
    frame: frame - 40,
    fps,
    from: 80,
    to: 0,
    config: { damping: 18, stiffness: 60 },
  });
  const browserOpacity = interpolate(frame, [40, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phone slides in
  const phoneX = spring({
    frame: frame - 56,
    fps,
    from: isPortrait ? 0 : 120,
    to: 0,
    config: { damping: 16, stiffness: 55 },
  });
  const phoneY = spring({
    frame: frame - 56,
    fps,
    from: isPortrait ? 100 : 40,
    to: 0,
    config: { damping: 16, stiffness: 55 },
  });
  const phoneOpacity = interpolate(frame, [56, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Speed badge
  const badgeAppear = spring({
    frame: frame - 72,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Old site dissolving */}
      {oldOpacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            opacity: oldOpacity,
            transform: `scale(${oldScale})`,
            filter: `blur(${oldBlur}px)`,
          }}
        >
          <LightBrowserFrame
            old
            url="nagelstudio-sabine.de"
            width={isPortrait ? 600 : 900}
            height={isPortrait ? 400 : 540}
          >
            <OldSalonMock />
          </LightBrowserFrame>
        </div>
      )}

      {/* Question overlay */}
      <div
        style={{
          position: "absolute",
          top: isPortrait ? "18%" : "12%",
          fontSize: isPortrait ? 34 : 42,
          fontWeight: 400,
          color: wt.textPrimary,
          textAlign: "center",
          opacity: questionOpacity * questionFadeOut,
          transform: `translateY(${questionY}px)`,
          letterSpacing: -0.8,
          lineHeight: 1.2,
          padding: "0 60px",
          fontStyle: "italic",
        }}
      >
        Was wäre, wenn dein Auftritt
        <br />
        so{" "}
        <span style={{ color: wt.accent, fontWeight: 700, fontStyle: "normal" }}>
          schön
        </span>{" "}
        wäre wie deine Arbeit?
      </div>

      {/* Modern browser */}
      <div
        style={{
          position: "absolute",
          left: isPortrait ? "50%" : "8%",
          top: isPortrait ? "32%" : "50%",
          transform: isPortrait
            ? `translate(-50%, ${browserY}px)`
            : `translateY(calc(-50% + ${browserY}px))`,
          opacity: browserOpacity,
        }}
      >
        <LightBrowserFrame
          url="nailart.studio"
          width={isPortrait ? 820 : 1000}
          height={isPortrait ? 540 : 600}
        >
          <NailStudioMock frame={frame} />
        </LightBrowserFrame>
      </div>

      {/* Phone */}
      <div
        style={{
          position: "absolute",
          right: isPortrait ? "50%" : "8%",
          bottom: isPortrait ? "6%" : "50%",
          transform: isPortrait
            ? `translate(50%, ${phoneY}px)`
            : `translate(0, calc(50% + ${phoneY}px)) translateX(${phoneX}px)`,
          opacity: phoneOpacity,
        }}
      >
        <LightPhoneFrame
          width={isPortrait ? 220 : 240}
          height={isPortrait ? 440 : 480}
        >
          <NailStudioMock frame={frame} mobile />
        </LightPhoneFrame>
      </div>

      {/* Speed badge */}
      <div
        style={{
          position: "absolute",
          right: isPortrait ? "12%" : "22%",
          top: isPortrait ? "34%" : "16%",
          backgroundColor: "#fff",
          border: `1px solid ${wt.border}`,
          borderRadius: 999,
          padding: "10px 20px",
          opacity: badgeAppear,
          transform: `scale(${0.85 + badgeAppear * 0.15})`,
          boxShadow: "0 12px 40px rgba(61,49,35,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#6BBF7A",
          }}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: wt.textPrimary,
            letterSpacing: -0.3,
          }}
        >
          Geladen in 0.3 s
        </span>
      </div>
    </AbsoluteFill>
  );
};
