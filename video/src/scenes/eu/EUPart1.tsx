import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { eu } from "../../euTheme";
import {
  EUFlag,
  GermanFlag,
  EUMap,
  EuroSymbol,
  SceneTitle,
  LowerThird,
} from "../../components/EUElements";

// ═══════════════════════════════════════════════════════════════════════════
// Scene 1 — Hook (0–210f / 0:00–0:07)
// "Deutschland zahlt jedes Jahr Milliarden an die EU… und bekommt weniger zurück.
//  Warum machen wir das überhaupt?"
// ═══════════════════════════════════════════════════════════════════════════

export const ES1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Three lines come in sequentially
  const line1Op = interpolate(frame, [6, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line1Y = interpolate(frame, [6, 22], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line2Op = interpolate(frame, [56, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2Y = interpolate(frame, [56, 72], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line3Op = interpolate(frame, [120, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line3Y = interpolate(frame, [120, 140], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Euro symbols flowing out
  const euroCount = 8;
  const euros = Array.from({ length: euroCount }).map((_, i) => {
    const startFrame = 30 + i * 16;
    const life = Math.max(0, frame - startFrame);
    const y = interpolate(life, [0, 80], [0, -300], {
      extrapolateRight: "clamp",
    });
    const x = interpolate(life, [0, 80], [0, (i % 2 === 0 ? -1 : 1) * 80]);
    const op = interpolate(life, [0, 20, 60, 80], [0, 0.7, 0.7, 0], {
      extrapolateRight: "clamp",
    });
    const scale = interpolate(life, [0, 20], [0.5, 1], {
      extrapolateRight: "clamp",
    });
    return { y, x, op, scale, key: i };
  });

  // Flag transition DE → EU in background
  const flagMix = interpolate(frame, [50, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Final emphasis pulse
  const pulse = spring({
    frame: frame - 160,
    fps,
    from: 0.98,
    to: 1.02,
    config: { damping: 12, stiffness: 80 },
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Background flags */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "10%",
          opacity: (1 - flagMix) * 0.25,
          filter: "blur(2px)",
        }}
      >
        <GermanFlag width={360} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "10%",
          opacity: flagMix * 0.25,
          filter: "blur(2px)",
        }}
      >
        <EUFlag size={360} waveFrame={frame} />
      </div>

      {/* Flying euro symbols */}
      {euros.map((e) => (
        <div
          key={e.key}
          style={{
            position: "absolute",
            transform: `translate(${e.x}px, ${e.y}px) scale(${e.scale})`,
            opacity: e.op,
          }}
        >
          <EuroSymbol size={60} color={eu.euGold} />
        </div>
      ))}

      {/* Text */}
      <div
        style={{
          textAlign: "center",
          maxWidth: 1500,
          padding: "0 80px",
          transform: `scale(${pulse})`,
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: eu.textPrimary,
            lineHeight: 1.15,
            letterSpacing: -1.5,
            opacity: line1Op,
            transform: `translateY(${line1Y}px)`,
            marginBottom: 20,
          }}
        >
          Deutschland zahlt jedes Jahr{" "}
          <span style={{ color: eu.euGold }}>Milliarden</span> an die EU.
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 500,
            color: eu.textMuted,
            lineHeight: 1.2,
            opacity: line2Op,
            transform: `translateY(${line2Y}px)`,
            marginBottom: 32,
          }}
        >
          Und bekommt weniger zurück.
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: eu.warning,
            lineHeight: 1.2,
            letterSpacing: -1,
            opacity: line3Op,
            transform: `translateY(${line3Y}px)`,
          }}
        >
          Warum machen wir das überhaupt?
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Scene 2 — Pattern Interrupt (210–420f / 0:07–0:14)
// "Oder ist die EU genau der Grund, warum Deutschland so reich ist?"
// ═══════════════════════════════════════════════════════════════════════════

export const ES2Interrupt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Sharp cut in — quick zoom
  const zoomScale = interpolate(frame, [0, 14], [1.15, 1], {
    extrapolateRight: "clamp",
  });
  const flash = interpolate(frame, [0, 6], [1, 0], {
    extrapolateRight: "clamp",
  });

  // Main text
  const textOp = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [8, 22], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Highlight word
  const highlightOp = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Industry icons reveal
  const iconAppear = (delay: number) =>
    spring({
      frame: frame - delay,
      fps,
      from: 0,
      to: 1,
      config: { damping: 16, stiffness: 80 },
    });

  const icons = [
    { label: "Autos", emoji: "🚗", delay: 100 },
    { label: "Maschinen", emoji: "⚙️", delay: 112 },
    { label: "Export", emoji: "📦", delay: 124 },
    { label: "Technik", emoji: "🔧", delay: 136 },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${zoomScale})`,
      }}
    >
      {/* Flash */}
      <AbsoluteFill
        style={{
          backgroundColor: "#fff",
          opacity: flash * 0.15,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          textAlign: "center",
          maxWidth: 1500,
          padding: "0 80px",
        }}
      >
        <div
          style={{
            fontSize: 15,
            color: eu.accent,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 20,
            opacity: textOp,
          }}
        >
          Oder...
        </div>
        <div
          style={{
            fontSize: 62,
            fontWeight: 800,
            color: eu.textPrimary,
            lineHeight: 1.15,
            letterSpacing: -1.5,
            opacity: textOp,
            transform: `translateY(${textY}px)`,
            marginBottom: 50,
          }}
        >
          Ist die EU genau der Grund,
          <br />
          warum Deutschland{" "}
          <span
            style={{
              color: eu.euGold,
              opacity: highlightOp,
              borderBottom: `4px solid ${eu.euGold}`,
              paddingBottom: 2,
            }}
          >
            so reich
          </span>{" "}
          ist?
        </div>

        {/* Industry icons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 36,
          }}
        >
          {icons.map((ic) => {
            const a = iconAppear(ic.delay);
            return (
              <div
                key={ic.label}
                style={{
                  opacity: a,
                  transform: `translateY(${(1 - a) * 20}px) scale(${a})`,
                  backgroundColor: eu.surface,
                  border: `1px solid ${eu.border}`,
                  borderRadius: 14,
                  padding: "18px 22px",
                  minWidth: 140,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 4 }}>{ic.emoji}</div>
                <div
                  style={{
                    fontSize: 14,
                    color: eu.textMuted,
                    fontWeight: 600,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  {ic.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Scene 3 — What is the EU (420–1020f / 0:14–0:34)
// 27 countries, post WWII, peace + economy
// ═══════════════════════════════════════════════════════════════════════════

export const ES3WhatIsEU: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title section
  const titleOp = interpolate(frame, [4, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [4, 26], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleFadeOut = interpolate(frame, [140, 170], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Map reveal
  const mapOp = interpolate(frame, [150, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mapScale = spring({
    frame: frame - 150,
    fps,
    from: 0.9,
    to: 1,
    config: { damping: 18, stiffness: 60 },
  });

  // "27 Länder" counter
  const counter = Math.round(
    interpolate(frame, [200, 280], [0, 27], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const counterOp = interpolate(frame, [200, 218], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Nach dem Zweiten Weltkrieg" fact
  const fact1Op = interpolate(frame, [340, 360], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fact1Out = interpolate(frame, [440, 460], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Frieden + Wirtschaft"
  const fact2Op = interpolate(frame, [470, 495], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Title section (first 5 seconds) */}
      <div
        style={{
          position: "absolute",
          opacity: titleOp * titleFadeOut,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: eu.accent,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 22,
          }}
        >
          Kapitel 1 — Was ist die EU?
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: eu.textPrimary,
            lineHeight: 1.02,
            letterSpacing: -3,
          }}
        >
          Die <span style={{ color: eu.euGold }}>Europäische Union</span>
        </div>
      </div>

      {/* Map + counter section */}
      <div
        style={{
          opacity: mapOp,
          transform: `scale(${mapScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        <EUMap width={900} highlightAll frame={frame - 150} />
      </div>

      {/* Counter overlay */}
      <div
        style={{
          position: "absolute",
          top: 100,
          right: 120,
          opacity: counterOp,
          textAlign: "right",
        }}
      >
        <div
          style={{
            fontSize: 180,
            fontWeight: 900,
            color: eu.euGold,
            lineHeight: 1,
            letterSpacing: -6,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {counter}
        </div>
        <div
          style={{
            fontSize: 22,
            color: eu.textMuted,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginTop: -10,
          }}
        >
          Mitgliedsstaaten
        </div>
      </div>

      {/* Fact 1 — Nach dem Zweiten Weltkrieg */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 80,
          opacity: fact1Op * fact1Out,
          maxWidth: 900,
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
          Gegründet nach 1945
        </div>
        <div
          style={{
            fontSize: 30,
            color: eu.textPrimary,
            fontWeight: 600,
            lineHeight: 1.3,
            paddingLeft: 19,
          }}
        >
          Nach dem Zweiten Weltkrieg — um Frieden in Europa
          <br />
          dauerhaft zu sichern.
        </div>
      </div>

      {/* Fact 2 — Frieden + Wirtschaft */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 80,
          opacity: fact2Op,
          maxWidth: 900,
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
          Das Ziel
        </div>
        <div
          style={{
            fontSize: 30,
            color: eu.textPrimary,
            fontWeight: 600,
            lineHeight: 1.3,
            paddingLeft: 19,
          }}
        >
          <span style={{ color: eu.euGold }}>Frieden.</span> Und
          wirtschaftliche Stärke durch Zusammenhalt.
        </div>
      </div>
    </AbsoluteFill>
  );
};
