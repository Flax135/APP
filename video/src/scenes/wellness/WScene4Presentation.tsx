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
import { LightBrowserFrame } from "../../components/WellnessFrames";
import {
  NailStudioMock,
  SpaMock,
  BeautySalonMock,
} from "../../components/WellnessSiteMocks";

// Scene 4 — Presentation (270–420 frames, 5 s)
// FlaxDesigning logo, tagline, then three browser mockups fan in.
export const WScene4Presentation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;

  // Logo entrance
  const logoScale = spring({
    frame: frame - 4,
    fps,
    from: 0.9,
    to: 1,
    config: { damping: 18, stiffness: 70 },
  });
  const logoOpacity = interpolate(frame, [4, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline
  const taglineOpacity = interpolate(frame, [18, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [18, 34], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Three browsers fan in with stagger
  const browserAppear = (delay: number) => ({
    opacity: interpolate(frame, [delay, delay + 16], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    scale: spring({
      frame: frame - delay,
      fps,
      from: 0.88,
      to: 1,
      config: { damping: 16, stiffness: 60 },
    }),
    y: spring({
      frame: frame - delay,
      fps,
      from: 50,
      to: 0,
      config: { damping: 16, stiffness: 60 },
    }),
  });

  const b1 = browserAppear(36);
  const b2 = browserAppear(48);
  const b3 = browserAppear(60);

  // Browser dimensions
  const bw = isPortrait ? 740 : 520;
  const bh = isPortrait ? 440 : 340;

  // Gentle breathing on hold
  const breathing = 1 + Math.sin((frame - 90) * 0.06) * 0.003;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: isPortrait ? "flex-start" : "center",
        paddingTop: isPortrait ? 120 : 0,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale * breathing})`,
          marginBottom: isPortrait ? 14 : 12,
        }}
      >
        <WellnessFlaxLogo scale={isPortrait ? 1 : 1.2} />
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: isPortrait ? 26 : 30,
          fontWeight: 400,
          color: wt.textMuted,
          textAlign: "center",
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          letterSpacing: -0.3,
          marginBottom: isPortrait ? 50 : 36,
        }}
      >
        Websites für{" "}
        <span style={{ color: wt.accent, fontWeight: 700 }}>deine Branche</span>
        .
      </div>

      {/* Browser fan-in */}
      <div
        style={{
          display: "flex",
          flexDirection: isPortrait ? "column" : "row",
          gap: isPortrait ? 24 : 28,
          alignItems: "center",
        }}
      >
        {/* Nail Studio */}
        <div
          style={{
            opacity: b1.opacity,
            transform: `translateY(${b1.y}px) scale(${b1.scale}) rotate(${isPortrait ? 0 : -3}deg)`,
          }}
        >
          <LightBrowserFrame url="nailart.studio" width={bw} height={bh}>
            <NailStudioMock frame={frame} />
          </LightBrowserFrame>
        </div>

        {/* Spa */}
        <div
          style={{
            opacity: b2.opacity,
            transform: `translateY(${b2.y}px) scale(${b2.scale})`,
            zIndex: 2,
          }}
        >
          <LightBrowserFrame url="serenity-spa.de" width={bw} height={bh}>
            <SpaMock frame={frame} />
          </LightBrowserFrame>
        </div>

        {/* Beauty Salon */}
        <div
          style={{
            opacity: b3.opacity,
            transform: `translateY(${b3.y}px) scale(${b3.scale}) rotate(${isPortrait ? 0 : 3}deg)`,
          }}
        >
          <LightBrowserFrame url="beaute-salon.de" width={bw} height={bh}>
            <BeautySalonMock frame={frame} />
          </LightBrowserFrame>
        </div>
      </div>
    </AbsoluteFill>
  );
};
