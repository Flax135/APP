import React from "react";
import { theme } from "../theme";

// =============================================================================
// Modern hero mock — used as the "flagship" FlaxDesigning look
// =============================================================================
export const ModernHeroMock: React.FC<{ frame: number; mobile?: boolean }> = ({
  frame,
  mobile = false,
}) => {
  // Subtle button pulse
  const pulse = 1 + Math.sin(frame * 0.14) * 0.03;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: theme.bgAlt,
        display: "flex",
        flexDirection: "column",
        color: theme.textPrimary,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Soft accent glow in background */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          right: "-20%",
          width: "70%",
          height: "120%",
          background: `radial-gradient(ellipse at center, ${theme.accentSoft} 0%, rgba(0,0,0,0) 60%)`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Nav */}
      <div
        style={{
          padding: mobile ? "14px 14px 0" : "26px 44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: mobile ? 14 : 20,
            fontWeight: 900,
            letterSpacing: -0.8,
          }}
        >
          Flax<span style={{ color: theme.accent }}>.</span>
        </div>
        {!mobile && (
          <div
            style={{
              display: "flex",
              gap: 28,
              fontSize: 14,
              color: theme.textMuted,
              fontWeight: 500,
            }}
          >
            <span>Leistungen</span>
            <span>Projekte</span>
            <span>Kontakt</span>
          </div>
        )}
      </div>

      {/* Hero */}
      <div
        style={{
          flex: 1,
          padding: mobile ? "20px 14px" : "40px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: mobile ? 9 : 13,
            color: theme.accent,
            fontWeight: 700,
            marginBottom: mobile ? 8 : 14,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          ● Moderne Websites
        </div>
        <div
          style={{
            fontSize: mobile ? 26 : 62,
            fontWeight: 900,
            lineHeight: 0.98,
            letterSpacing: -2,
            marginBottom: mobile ? 10 : 22,
            maxWidth: mobile ? "100%" : "85%",
          }}
        >
          Designs,
          <br />
          die <span style={{ color: theme.accent }}>verkaufen</span>.
        </div>
        <div
          style={{
            fontSize: mobile ? 11 : 17,
            color: theme.textMuted,
            marginBottom: mobile ? 14 : 28,
            maxWidth: mobile ? "100%" : 440,
            lineHeight: 1.45,
            fontWeight: 400,
          }}
        >
          Schnell. Mobil. Konvertierend. Für kleine Unternehmen mit großen Zielen.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div
            style={{
              backgroundColor: theme.accent,
              color: theme.bg,
              padding: mobile ? "9px 16px" : "16px 26px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: mobile ? 11 : 15,
              transform: `scale(${pulse})`,
              boxShadow: `0 12px 28px ${theme.accentSoft}`,
            }}
          >
            Projekt starten →
          </div>
          {!mobile && (
            <div
              style={{
                border: `1px solid ${theme.borderStrong}`,
                color: theme.textPrimary,
                padding: "16px 26px",
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Referenzen
            </div>
          )}
        </div>
      </div>

      {/* Floating stat card (desktop only) */}
      {!mobile && (
        <div
          style={{
            position: "absolute",
            right: 44,
            top: 130,
            width: 240,
            backgroundColor: theme.surface,
            border: `1px solid ${theme.borderStrong}`,
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: theme.textMuted,
              marginBottom: 8,
              fontWeight: 500,
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Conversion Rate
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: theme.accent,
              letterSpacing: -1,
            }}
          >
            +247%
          </div>
          <div
            style={{
              marginTop: 12,
              height: 4,
              backgroundColor: theme.border,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "82%",
                height: "100%",
                background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentAlt})`,
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Ecommerce mock
// =============================================================================
export const EcommerceMock: React.FC<{ frame: number }> = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: theme.bg,
        padding: 32,
        color: theme.textPrimary,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.8 }}>
          SHOP<span style={{ color: theme.accent }}>.</span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 22,
            fontSize: 13,
            color: theme.textMuted,
            fontWeight: 500,
          }}
        >
          <span>Neu</span>
          <span>Sale</span>
          <span>Kontakt</span>
        </div>
      </div>

      <div
        style={{
          fontSize: 44,
          fontWeight: 900,
          letterSpacing: -1.5,
          marginBottom: 24,
          lineHeight: 1,
        }}
      >
        Neue <span style={{ color: theme.accent }}>Kollektion</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          flex: 1,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              overflow: "hidden",
              border: `1px solid ${theme.border}`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 90,
                background: `linear-gradient(135deg, ${
                  i % 2 === 0 ? theme.accentSoft : "rgba(255,255,255,0.04)"
                }, ${theme.surfaceHi})`,
              }}
            />
            <div style={{ padding: "10px 12px" }}>
              <div
                style={{
                  fontSize: 10,
                  color: theme.textMuted,
                  fontWeight: 500,
                }}
              >
                Produkt {i + 1}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: theme.accent,
                  letterSpacing: -0.3,
                }}
              >
                € {29 + i * 10},–
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Portfolio mock — statement typography
// =============================================================================
export const PortfolioMock: React.FC<{ frame: number }> = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: theme.bgAlt,
        color: theme.textPrimary,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: "-40%",
          left: "-20%",
          width: "90%",
          height: "110%",
          background: `radial-gradient(ellipse at center, ${theme.accentSoft} 0%, rgba(0,0,0,0) 60%)`,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          padding: "30px 44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1 }}>
          STUDIO
        </div>
        <div
          style={{
            fontSize: 12,
            color: theme.textMuted,
            fontWeight: 500,
          }}
        >
          Portfolio 2025
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: "0 44px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 84,
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: -4,
            color: theme.textPrimary,
          }}
        >
          Wir
          <br />
          gestalten
          <br />
          <span style={{ color: theme.accent }}>Zukunft.</span>
        </div>
        <div
          style={{
            marginTop: 32,
            display: "flex",
            gap: 22,
            fontSize: 14,
            color: theme.textMuted,
            fontWeight: 500,
          }}
        >
          <div>12+ Projekte</div>
          <div>•</div>
          <div>4.9★ Bewertung</div>
          <div>•</div>
          <div>seit 2019</div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Old/bad website mock — the "before" state
// =============================================================================
export const OldSiteMock: React.FC = () => (
  <div
    style={{
      background: "#ffff99",
      width: "100%",
      height: "100%",
      padding: 28,
      fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive",
      color: "#000",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        fontSize: 52,
        color: "#ff0000",
        textDecoration: "underline",
        fontWeight: "bold",
      }}
    >
      ★ Willkommen! ★
    </div>
    <div style={{ marginTop: 14, fontSize: 20, color: "#0000ff" }}>
      Beste Ansicht in Internet Explorer 6
    </div>
    <div style={{ marginTop: 8, fontSize: 18 }}>
      Sie sind der <span style={{ color: "#ff0000" }}>1.337</span>ste Besucher!
    </div>
    <div
      style={{
        marginTop: 24,
        width: 340,
        height: 160,
        background: "#888",
        border: "6px ridge #ccc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 16,
      }}
    >
      [Bild wird geladen…]
    </div>
    <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
      <span
        style={{
          background: "#ff0000",
          color: "#ffff00",
          padding: "6px 14px",
          fontWeight: "bold",
          fontSize: 18,
        }}
      >
        NEU!!!
      </span>
      <span
        style={{
          background: "#00ff00",
          color: "#000",
          padding: "6px 14px",
          fontSize: 16,
        }}
      >
        Gästebuch
      </span>
    </div>
  </div>
);
