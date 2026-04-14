import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { eu } from "../../euTheme";
import { EUFlag } from "../../components/EUElements";

// ═══════════════════════════════════════════════════════════════════════════
// Scene 7 — Conflict (4020–4620f / 2:14–2:34, 20 s)
// The real conflict: Germany loses money AND earns more through EU.
// ═══════════════════════════════════════════════════════════════════════════

export const ES7Conflict: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const kickerOp = interpolate(frame, [4, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOp = interpolate(frame, [18, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [18, 40], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scale (Waage)
  const scaleOp = interpolate(frame, [80, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Tilt of scale: left (loss) first dominates, then right (gain) wins
  const tilt = interpolate(
    frame,
    [120, 200, 320, 420],
    [0, -10, 10, 6],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Question
  const questionOp = interpolate(frame, [440, 480], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Title */}
      <div
        style={{
          textAlign: "center",
          position: "absolute",
          top: 80,
          left: 100,
          right: 100,
        }}
      >
        <div
          style={{
            fontSize: 17,
            color: eu.accent,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 18,
            opacity: kickerOp,
          }}
        >
          Der eigentliche Konflikt
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: eu.textPrimary,
            lineHeight: 1.05,
            letterSpacing: -2,
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Die Wahrheit ist{" "}
          <span style={{ color: eu.euGold }}>kompliziert.</span>
        </div>
      </div>

      {/* Scale (Waage) */}
      <div
        style={{
          opacity: scaleOp,
          transform: `translateY(30px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Scale bar */}
        <div
          style={{
            position: "relative",
            width: 900,
            height: 300,
          }}
        >
          {/* Fulcrum */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 0,
              transform: "translateX(-50%)",
              width: 16,
              height: 200,
              background: `linear-gradient(to bottom, ${eu.textMuted}, ${eu.textDim})`,
              borderRadius: 4,
            }}
          />
          {/* Beam */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 60,
              transform: `translateX(-50%) rotate(${tilt}deg)`,
              transformOrigin: "center center",
              width: 800,
              height: 10,
              background: `linear-gradient(90deg, ${eu.warning}, ${eu.euGold})`,
              borderRadius: 5,
              boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            {/* Left pan */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 10,
                width: 240,
                marginLeft: -110,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 220,
                  height: 120,
                  backgroundColor: eu.warningSoft,
                  border: `2px solid ${eu.warning}`,
                  borderRadius: 14,
                  padding: 16,
                  textAlign: "center",
                  transform: `translateY(${-tilt * 2}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: eu.warning,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Verlust
                </div>
                <div
                  style={{
                    fontSize: 38,
                    color: eu.warning,
                    fontWeight: 900,
                    letterSpacing: -1,
                    lineHeight: 1,
                  }}
                >
                  − Mrd.
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: eu.textMuted,
                    fontWeight: 500,
                    marginTop: 8,
                  }}
                >
                  Netto-Beitrag
                </div>
              </div>
            </div>
            {/* Right pan */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 10,
                width: 240,
                marginRight: -110,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 220,
                  height: 120,
                  backgroundColor: eu.euGoldSoft,
                  border: `2px solid ${eu.euGold}`,
                  borderRadius: 14,
                  padding: 16,
                  textAlign: "center",
                  transform: `translateY(${tilt * 2}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: eu.euGold,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Gewinn
                </div>
                <div
                  style={{
                    fontSize: 38,
                    color: eu.euGold,
                    fontWeight: 900,
                    letterSpacing: -1,
                    lineHeight: 1,
                  }}
                >
                  ++ Mrd.
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: eu.textMuted,
                    fontWeight: 500,
                    marginTop: 8,
                  }}
                >
                  Export-Gewinne
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div
        style={{
          position: "absolute",
          bottom: 90,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: questionOp,
        }}
      >
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: eu.textPrimary,
            letterSpacing: -1,
            lineHeight: 1.2,
          }}
        >
          Verlust oder <span style={{ color: eu.euGold }}>Gewinn</span>?
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Scene 8 — Mindblow (4620–5040f / 2:34–2:48, 14 s)
// "Ohne EU: Zölle, Langsamer, Teurer, Wirtschaft geschwächt."
// ═══════════════════════════════════════════════════════════════════════════

export const ES8Mindblow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Stellen wir uns vor..."
  const kickerOp = interpolate(frame, [4, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Headline
  const hlOp = interpolate(frame, [26, 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hlY = interpolate(frame, [26, 46], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Three consequences
  const conseq = [
    { label: "Zölle zurück", value: "+ Kosten", delay: 120, color: eu.warning },
    { label: "Handel", value: "langsamer", delay: 170, color: eu.warning },
    { label: "Produkte", value: "teurer", delay: 220, color: eu.warning },
  ];

  return (
    <AbsoluteFill style={{ padding: "100px 100px" }}>
      {/* Kicker */}
      <div
        style={{
          textAlign: "center",
          opacity: kickerOp,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontSize: 17,
            color: eu.warning,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Was wäre ohne die EU?
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          textAlign: "center",
          opacity: hlOp,
          transform: `translateY(${hlY}px)`,
          marginBottom: 60,
        }}
      >
        <div
          style={{
            fontSize: 78,
            fontWeight: 900,
            color: eu.textPrimary,
            lineHeight: 1.02,
            letterSpacing: -3,
          }}
        >
          Grenzen.{" "}
          <span style={{ color: eu.warning }}>Zölle.</span>
          {" "}Stillstand.
        </div>
      </div>

      {/* Three consequence cards */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 40,
          marginBottom: 60,
        }}
      >
        {conseq.map((c) => {
          const a = spring({
            frame: frame - c.delay,
            fps,
            from: 0,
            to: 1,
            config: { damping: 16, stiffness: 80 },
          });
          return (
            <div
              key={c.label}
              style={{
                opacity: a,
                transform: `translateY(${(1 - a) * 24}px) scale(${
                  0.92 + a * 0.08
                })`,
                backgroundColor: eu.surface,
                border: `1px solid ${c.color}55`,
                borderRadius: 18,
                padding: "30px 44px",
                minWidth: 260,
                textAlign: "center",
                boxShadow: `0 20px 50px rgba(229,75,75,0.15)`,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: eu.textMuted,
                  fontWeight: 600,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: c.color,
                  letterSpacing: -1,
                  lineHeight: 1,
                }}
              >
                {c.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Conclusion */}
      <div
        style={{
          textAlign: "center",
          opacity: interpolate(frame, [290, 320], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          marginTop: 30,
        }}
      >
        <div
          style={{
            fontSize: 32,
            color: eu.textMuted,
            fontWeight: 500,
            lineHeight: 1.3,
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          Ohne die EU könnte die Wirtschaft deutlich{" "}
          <span style={{ color: eu.warning, fontWeight: 800 }}>
            geschwächt
          </span>{" "}
          werden.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Scene 9 — Conclusion + CTA (5040–5400f / 2:48–3:00, 12 s)
// "Kein perfektes System. Kein Fehler. Was denkst du?"
// ═══════════════════════════════════════════════════════════════════════════

export const ES9Conclusion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Line 1: "Die EU ist kein perfektes System."
  const l1Op = interpolate(frame, [4, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const l1Y = interpolate(frame, [4, 24], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Line 2: "Aber auch kein Fehler."
  const l2Op = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const l2Y = interpolate(frame, [50, 70], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Summary
  const sumOp = interpolate(frame, [110, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Call to action
  const ctaOp = interpolate(frame, [180, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaScale = spring({
    frame: frame - 180,
    fps,
    from: 0.92,
    to: 1,
    config: { damping: 16, stiffness: 70 },
  });

  // EU flag pulse in background
  const flagOp = interpolate(frame, [0, 40, 300, 360], [0, 0.12, 0.12, 0.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* EU flag background */}
      <div style={{ position: "absolute", opacity: flagOp, filter: "blur(1px)" }}>
        <EUFlag size={600} waveFrame={frame} />
      </div>

      <div
        style={{
          textAlign: "center",
          padding: "0 100px",
          maxWidth: 1500,
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            fontSize: 58,
            fontWeight: 700,
            color: eu.textPrimary,
            lineHeight: 1.12,
            letterSpacing: -2,
            opacity: l1Op,
            transform: `translateY(${l1Y}px)`,
            marginBottom: 14,
          }}
        >
          Die EU ist kein{" "}
          <span style={{ color: eu.textMuted }}>perfektes</span> System.
        </div>

        {/* Line 2 */}
        <div
          style={{
            fontSize: 58,
            fontWeight: 700,
            color: eu.textPrimary,
            lineHeight: 1.12,
            letterSpacing: -2,
            opacity: l2Op,
            transform: `translateY(${l2Y}px)`,
            marginBottom: 48,
          }}
        >
          Aber auch{" "}
          <span style={{ color: eu.euGold }}>kein Fehler.</span>
        </div>

        {/* Summary */}
        <div
          style={{
            fontSize: 26,
            color: eu.textMuted,
            fontWeight: 400,
            lineHeight: 1.45,
            opacity: sumOp,
            maxWidth: 1100,
            margin: "0 auto 60px",
          }}
        >
          Sie kostet Deutschland Geld — bringt aber gleichzeitig
          <br />
          noch <span style={{ color: eu.euGold, fontWeight: 700 }}>mehr zurück</span>.
        </div>

        {/* Call to action */}
        <div
          style={{
            opacity: ctaOp,
            transform: `scale(${ctaScale})`,
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: eu.accent,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Was denkst du?
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: eu.textPrimary,
              letterSpacing: -1,
              lineHeight: 1.2,
            }}
          >
            EU — gut oder schlecht für Deutschland?
          </div>
          <div
            style={{
              fontSize: 20,
              color: eu.textDim,
              marginTop: 22,
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            Schreib's in die Kommentare. ↓
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
