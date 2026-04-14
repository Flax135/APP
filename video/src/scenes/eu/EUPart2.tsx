import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { eu } from "../../euTheme";
import { EUMap, StatTile } from "../../components/EUElements";

// ═══════════════════════════════════════════════════════════════════════════
// Scene 4 — Benefits (1020–1800f / 0:34–1:00, 26 s)
// "Keine Grenzkontrollen. Gemeinsame Währung. Freier Handel. Arbeiten im Ausland."
// ═══════════════════════════════════════════════════════════════════════════

export const ES4Benefits: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleOp = interpolate(frame, [4, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOut = interpolate(frame, [90, 110], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Four benefits come in sequentially; each holds on screen
  const benefits = [
    {
      title: "Keine Grenzkontrollen",
      subtitle: "Reisen zwischen EU-Ländern — ohne Pass, ohne Warten.",
      icon: "🛂",
      color: eu.success,
      from: 130,
    },
    {
      title: "Eine gemeinsame Währung",
      subtitle: "Der Euro — in 20 Ländern. Kein Geldwechsel. Kein Aufschlag.",
      icon: "€",
      color: eu.euGold,
      from: 290,
    },
    {
      title: "Freier Handel",
      subtitle: "Waren fließen ohne Zölle quer durch den Binnenmarkt.",
      icon: "🚛",
      color: eu.accent,
      from: 450,
    },
    {
      title: "Arbeiten im Ausland",
      subtitle: "EU-Bürger dürfen überall in der Union leben und arbeiten.",
      icon: "💼",
      color: eu.euBlueLight,
      from: 610,
    },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px" }}>
      {/* Chapter title */}
      <div
        style={{
          opacity: titleOp * titleOut,
          marginBottom: 48,
        }}
      >
        <div
          style={{
            fontSize: 16,
            color: eu.accent,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Was die EU konkret bringt
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            color: eu.textPrimary,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          Vier Prinzipien,
          <br />
          <span style={{ color: eu.euGold }}>die alles verändern.</span>
        </div>
      </div>

      {/* Stacking benefit cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {benefits.map((b, i) => {
          const appear = spring({
            frame: frame - b.from,
            fps,
            from: 0,
            to: 1,
            config: { damping: 16, stiffness: 70 },
          });
          const op = interpolate(
            frame,
            [b.from, b.from + 18],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                padding: "24px 32px",
                backgroundColor: eu.surface,
                border: `1px solid ${eu.border}`,
                borderRadius: 18,
                opacity: op,
                transform: `translateX(${(1 - appear) * -30}px) scale(${
                  0.97 + appear * 0.03
                })`,
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              {/* Number */}
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: b.color,
                  letterSpacing: -2,
                  minWidth: 68,
                  fontVariantNumeric: "tabular-nums",
                  opacity: 0.6,
                }}
              >
                0{i + 1}
              </div>
              {/* Icon */}
              <div
                style={{
                  fontSize: 56,
                  width: 88,
                  height: 88,
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  color: b.color,
                }}
              >
                {b.icon}
              </div>
              {/* Text */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: eu.textPrimary,
                    letterSpacing: -1,
                    marginBottom: 6,
                  }}
                >
                  {b.title}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: eu.textMuted,
                    fontWeight: 400,
                    lineHeight: 1.4,
                  }}
                >
                  {b.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Scene 5 — Germany Profit (1800–2940f / 1:00–1:38, 38 s)
// "Export-Weltmeister. Ohne Zölle. Milliarden-Geschäfte. Ohne EU → weniger Export."
// ═══════════════════════════════════════════════════════════════════════════

export const ES5GermanyProfit: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title intro
  const kickerOp = interpolate(frame, [4, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOp = interpolate(frame, [18, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [18, 40], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOut = interpolate(frame, [150, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Export map section (150–700)
  const mapOp = interpolate(frame, [180, 230], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mapOut = interpolate(frame, [700, 740], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Export arrow counter
  const numArrows = 12;
  const mapFrame = frame - 180;

  // Stats section (740+)
  const statAppear = (delay: number) =>
    spring({
      frame: frame - delay,
      fps,
      from: 0,
      to: 1,
      config: { damping: 16, stiffness: 80 },
    });

  const stat1 = statAppear(780);
  const stat2 = statAppear(830);
  const stat3 = statAppear(880);

  // Counters
  const statCount1 = Math.round(
    interpolate(frame, [790, 860], [0, 1500], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const statCount2 = Math.round(
    interpolate(frame, [840, 910], [0, 55], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const statCount3 = Math.round(
    interpolate(frame, [890, 960], [0, 28], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Closing line
  const closingOp = interpolate(frame, [1000, 1030], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ padding: "80px 100px" }}>
      {/* Intro title */}
      <div
        style={{
          opacity: introOut,
          textAlign: "center",
          position: "absolute",
          top: "30%",
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
            marginBottom: 22,
            opacity: kickerOp,
          }}
        >
          Warum Deutschland profitiert
        </div>
        <div
          style={{
            fontSize: 110,
            fontWeight: 900,
            color: eu.textPrimary,
            lineHeight: 0.98,
            letterSpacing: -4,
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <span style={{ color: eu.euGold }}>Export-</span>
          <br />
          Weltmeister.
        </div>
      </div>

      {/* Map with export arrows */}
      <div
        style={{
          opacity: mapOp * mapOut,
          position: "absolute",
          top: "22%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <EUMap width={900} highlightGermany frame={mapFrame} />
        {/* Animated pulse indicator for Germany */}
      </div>

      {/* Export arrow overlay (SVG drawn paths from Germany to rest) */}
      <div
        style={{
          position: "absolute",
          top: "22%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 630,
          pointerEvents: "none",
          opacity: mapOp * mapOut,
        }}
      >
        <svg width="900" height="630" viewBox="0 0 100 70">
          {Array.from({ length: numArrows }).map((_, i) => {
            const delay = 250 + i * 30;
            const progress = interpolate(
              frame,
              [delay, delay + 60],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const fade = interpolate(
              frame,
              [delay + 40, delay + 120],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const angle = (i / numArrows) * Math.PI * 2;
            const targetX = 52 + Math.cos(angle) * 18;
            const targetY = 38 + Math.sin(angle) * 14;
            const currentX = 52 + (targetX - 52) * progress;
            const currentY = 38 + (targetY - 38) * progress;
            return (
              <g key={i} opacity={fade}>
                <line
                  x1={52}
                  y1={38}
                  x2={currentX}
                  y2={currentY}
                  stroke={eu.euGold}
                  strokeWidth={0.4}
                  opacity={0.8}
                />
                <circle
                  cx={currentX}
                  cy={currentY}
                  r={0.8}
                  fill={eu.euGold}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Lower third during map section */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 80,
          opacity: mapOp * mapOut,
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
          Binnenmarkt
        </div>
        <div
          style={{
            fontSize: 28,
            color: eu.textPrimary,
            fontWeight: 600,
            lineHeight: 1.3,
            paddingLeft: 19,
          }}
        >
          Ohne Zölle verkauft Deutschland Produkte in ganz Europa —
          einfach, schnell, milliardenschwer.
        </div>
      </div>

      {/* Stats block */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 32,
          opacity: interpolate(frame, [750, 790], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <StatTile
          value={`${statCount1.toLocaleString("de-DE")} Mrd.`}
          label="Exporte / Jahr ( €)"
          color={eu.euGold}
          opacity={stat1}
          scale={0.92 + stat1 * 0.08}
          translateY={(1 - stat1) * 20}
        />
        <StatTile
          value={`${statCount2} %`}
          label="Export in EU-Länder"
          color={eu.accent}
          opacity={stat2}
          scale={0.92 + stat2 * 0.08}
          translateY={(1 - stat2) * 20}
        />
        <StatTile
          value={`${statCount3} Mio.`}
          label="Jobs vom Export"
          color={eu.success}
          opacity={stat3}
          scale={0.92 + stat3 * 0.08}
          translateY={(1 - stat3) * 20}
        />
      </div>

      {/* Closing emphasis */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: closingOp,
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
          Ohne EU →{" "}
          <span style={{ color: eu.warning }}>weniger Export.</span>
          <br />
          <span style={{ color: eu.textMuted, fontWeight: 500, fontSize: 32 }}>
            Weniger Export → weniger Geld.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Scene 6 — Downsides (2940–4020f / 1:38–2:14, 36 s)
// "Größter Geldgeber. Entscheidungen fallen in Brüssel. Bürokratie."
// ═══════════════════════════════════════════════════════════════════════════

export const ES6Downsides: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Intro — tone shift
  const kickerOp = interpolate(frame, [4, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOp = interpolate(frame, [18, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [18, 40], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOut = interpolate(frame, [140, 170], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Downside 1: Germany is biggest net contributor (170–520)
  const ds1Op = interpolate(frame, [170, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ds1Out = interpolate(frame, [510, 540], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const netContribution = Math.round(
    interpolate(frame, [200, 280], [0, 25], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Downside 2: Decisions in Brussels (540–800)
  const ds2Op = interpolate(frame, [540, 580], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ds2Out = interpolate(frame, [790, 820], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Downside 3: Bureaucracy (820+)
  const ds3Op = interpolate(frame, [820, 860], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ padding: "80px 100px" }}>
      {/* Intro title */}
      <div
        style={{
          opacity: introOut,
          position: "absolute",
          top: "30%",
          left: 100,
          right: 100,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 17,
            color: eu.warning,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 22,
            opacity: kickerOp,
          }}
        >
          Aber es gibt einen Haken
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: eu.textPrimary,
            lineHeight: 1,
            letterSpacing: -3.5,
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Die <span style={{ color: eu.warning }}>Schattenseite.</span>
        </div>
      </div>

      {/* Downside 1: Net contributor */}
      <div
        style={{
          opacity: ds1Op * ds1Out,
          position: "absolute",
          top: "20%",
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 16,
            color: eu.warning,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Nachteil 01 — Geldgeber
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: eu.textPrimary,
            lineHeight: 1.1,
            letterSpacing: -1.5,
            marginBottom: 40,
          }}
        >
          Deutschland zahlt{" "}
          <span style={{ color: eu.warning }}>mehr ein,</span>
          <br />
          als es zurückbekommt.
        </div>
        <div
          style={{
            fontSize: 200,
            fontWeight: 900,
            color: eu.warning,
            lineHeight: 1,
            letterSpacing: -6,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          − {netContribution}
        </div>
        <div
          style={{
            fontSize: 24,
            color: eu.textMuted,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginTop: -8,
          }}
        >
          Milliarden Euro netto / Jahr
        </div>
        <div
          style={{
            fontSize: 18,
            color: eu.textDim,
            marginTop: 22,
            maxWidth: 900,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.4,
          }}
        >
          Stellvertretende Größenordnung — größter Netto-Zahler der EU.
        </div>
      </div>

      {/* Downside 2: Decisions in Brussels */}
      <div
        style={{
          opacity: ds2Op * ds2Out,
          position: "absolute",
          top: "18%",
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        <div
          style={{
            fontSize: 16,
            color: eu.warning,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Nachteil 02 — Kontrolle
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: eu.textPrimary,
            lineHeight: 1.08,
            letterSpacing: -2,
            marginBottom: 40,
          }}
        >
          Viele Entscheidungen fallen
          <br />
          nicht mehr in Deutschland —
        </div>

        {/* City markers */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 80,
            marginTop: 36,
          }}
        >
          <div style={{ textAlign: "center", opacity: 0.4 }}>
            <div
              style={{
                fontSize: 28,
                color: eu.textMuted,
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              Berlin
            </div>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: eu.textMuted,
                margin: "10px auto",
              }}
            />
          </div>
          <div style={{ fontSize: 32, color: eu.warning }}>→</div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 48,
                color: eu.euGold,
                fontWeight: 800,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              Brüssel
            </div>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: eu.euGold,
                margin: "12px auto",
                boxShadow: `0 0 30px ${eu.euGold}`,
              }}
            />
          </div>
        </div>
        <div
          style={{
            fontSize: 22,
            color: eu.textMuted,
            marginTop: 44,
            maxWidth: 800,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.4,
            fontWeight: 400,
          }}
        >
          Gesetze, Regeln, Vorgaben — ein großer Teil davon kommt
          heute aus Brüssel statt aus Berlin.
        </div>
      </div>

      {/* Downside 3: Bureaucracy */}
      <div
        style={{
          opacity: ds3Op,
          position: "absolute",
          top: "18%",
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        <div
          style={{
            fontSize: 16,
            color: eu.warning,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Nachteil 03 — Bürokratie
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: eu.textPrimary,
            lineHeight: 1.08,
            letterSpacing: -2,
            marginBottom: 40,
          }}
        >
          Weniger Kontrolle.
          <br />
          <span style={{ color: eu.warning }}>Mehr Bürokratie.</span>
        </div>

        {/* Document stack visual */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 14,
            marginTop: 30,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => {
            const docAppear = spring({
              frame: frame - (880 + i * 8),
              fps,
              from: 0,
              to: 1,
              config: { damping: 16, stiffness: 80 },
            });
            return (
              <div
                key={i}
                style={{
                  width: 80,
                  height: 110,
                  backgroundColor: eu.surface,
                  border: `1px solid ${eu.borderStrong}`,
                  borderRadius: 4,
                  opacity: docAppear,
                  transform: `translateY(${(1 - docAppear) * 20}px) rotate(${
                    (i - 2) * 3
                  }deg)`,
                  display: "flex",
                  flexDirection: "column",
                  padding: 8,
                  gap: 4,
                }}
              >
                <div
                  style={{
                    height: 4,
                    backgroundColor: eu.textDim,
                    borderRadius: 2,
                    width: "80%",
                  }}
                />
                <div
                  style={{
                    height: 3,
                    backgroundColor: eu.textDim,
                    borderRadius: 2,
                    width: "60%",
                    opacity: 0.6,
                  }}
                />
                <div
                  style={{
                    height: 3,
                    backgroundColor: eu.textDim,
                    borderRadius: 2,
                    width: "70%",
                    opacity: 0.6,
                  }}
                />
                <div
                  style={{
                    height: 3,
                    backgroundColor: eu.textDim,
                    borderRadius: 2,
                    width: "50%",
                    opacity: 0.6,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div
          style={{
            fontSize: 22,
            color: eu.textMuted,
            marginTop: 44,
            maxWidth: 900,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.4,
            fontWeight: 400,
          }}
        >
          Regelwerke, Vorschriften, Meldepflichten — Kritiker sehen
          eine wachsende Verwaltungslast für Unternehmen und Staaten.
        </div>
      </div>
    </AbsoluteFill>
  );
};
