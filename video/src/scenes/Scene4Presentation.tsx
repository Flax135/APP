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
import { FlaxLogo } from "../components/FlaxLogo";
import {
  EcommerceMock,
  ModernHeroMock,
  PortfolioMock,
} from "../components/SiteMocks";

// Scene 4 — FlaxDesigning presentation
// Logo drops in, three browser mockups fan in behind/around each other,
// text at the bottom: "FlaxDesigning erstellt Websites, die verkaufen."
export const Scene4Presentation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;

  // Logo
  const logoOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });
  const logoY = spring({
    frame,
    fps,
    from: 24,
    to: 0,
    config: { damping: 200 },
  });

  // Browser fan-in (staggered)
  const fanIn = (delay: number) =>
    spring({
      frame: frame - delay,
      fps,
      from: 0,
      to: 1,
      config: { damping: 14, stiffness: 85 },
    });

  // Text
  const textOpacity = interpolate(frame, [55, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [55, 80], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bW = isPortrait ? 620 : 820;
  const bH = isPortrait ? 400 : 520;

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      {/* Logo */}
      <div
        style={{
          marginTop: isPortrait ? 120 : 90,
          opacity: logoOpacity,
          transform: `translateY(${logoY}px)`,
        }}
      >
        <FlaxLogo scale={isPortrait ? 0.85 : 1} />
      </div>

      {/* Browser stack */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: isPortrait ? "42%" : "50%",
          transform: "translate(-50%, -50%)",
          width: bW,
          height: bH,
        }}
      >
        {/* Back-left: Portfolio */}
        <div
          style={{
            position: "absolute",
            left: isPortrait ? -120 : -240,
            top: isPortrait ? 0 : 10,
            transform: `scale(${0.74 + fanIn(0) * 0.04}) rotate(${
              -8 + (1 - fanIn(0)) * 14
            }deg)`,
            transformOrigin: "center",
            opacity: fanIn(0) * 0.88,
            filter: `blur(${(1 - fanIn(0)) * 12}px)`,
          }}
        >
          <BrowserFrame
            url="studio.flaxdesigning.de"
            width={bW}
            height={bH}
          >
            <PortfolioMock frame={frame} />
          </BrowserFrame>
        </div>

        {/* Back-right: Ecommerce */}
        <div
          style={{
            position: "absolute",
            right: isPortrait ? -120 : -240,
            top: isPortrait ? 0 : 10,
            transform: `scale(${0.74 + fanIn(10) * 0.04}) rotate(${
              8 - (1 - fanIn(10)) * 14
            }deg)`,
            transformOrigin: "center",
            opacity: fanIn(10) * 0.88,
            filter: `blur(${(1 - fanIn(10)) * 12}px)`,
          }}
        >
          <BrowserFrame url="shop.flaxdesigning.de" width={bW} height={bH}>
            <EcommerceMock frame={frame} />
          </BrowserFrame>
        </div>

        {/* Front: Flagship hero */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `scale(${fanIn(20)})`,
            opacity: fanIn(20),
            transformOrigin: "center",
          }}
        >
          <BrowserFrame url="flaxdesigning.de" width={bW} height={bH}>
            <ModernHeroMock frame={frame} />
          </BrowserFrame>
        </div>
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: isPortrait ? 180 : 100,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          padding: "0 60px",
        }}
      >
        <h2
          style={{
            fontSize: isPortrait ? 62 : 80,
            fontWeight: 900,
            color: theme.textPrimary,
            margin: 0,
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          <span style={{ color: theme.accent }}>FlaxDesigning</span> erstellt
          <br />
          Websites, die verkaufen.
        </h2>
      </div>
    </AbsoluteFill>
  );
};
