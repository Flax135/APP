import React from "react";
import { wt } from "../wellnessTheme";

// ─── Old / dated beauty salon site (the "before" state) ─────────────────────
export const OldSalonMock: React.FC = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      background: "linear-gradient(180deg, #f0c0d0, #e8b0c0)",
      padding: 24,
      fontFamily: "'Times New Roman', serif",
      color: "#4a0028",
      overflow: "hidden",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: 42,
        fontWeight: "bold",
        color: "#8B008B",
      }}
    >
      ✿ Nagelstudio Sabine ✿
    </div>
    <div
      style={{
        fontSize: 16,
        marginTop: 6,
        color: "#666",
        fontStyle: "italic",
      }}
    >
      Ihr Nagelstudio in der Innenstadt!
    </div>
    <div
      style={{
        marginTop: 16,
        height: 120,
        background: "#c88",
        border: "4px double #a66",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 14,
      }}
    >
      [Bild wird geladen...]
    </div>
    <div style={{ marginTop: 14, fontSize: 14 }}>
      ☎ Rufen Sie an: 0123-456789
    </div>
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
        marginTop: 12,
      }}
    >
      <span
        style={{
          background: "#ff69b4",
          padding: "6px 12px",
          color: "#fff",
          fontSize: 14,
          fontWeight: "bold",
        }}
      >
        ANGEBOT!
      </span>
      <span
        style={{
          background: "#9370DB",
          padding: "6px 12px",
          color: "#fff",
          fontSize: 14,
        }}
      >
        Gästebuch
      </span>
    </div>
    <div style={{ marginTop: 12, fontSize: 11, color: "#888" }}>
      Letzte Aktualisierung: März 2016
    </div>
  </div>
);

// ─── Modern nail studio ─────────────────────────────────────────────────────
export const NailStudioMock: React.FC<{
  frame: number;
  mobile?: boolean;
}> = ({ frame, mobile = false }) => {
  const pulse = 1 + Math.sin(frame * 0.12) * 0.02;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#FBF8F4",
        display: "flex",
        flexDirection: "column",
        color: wt.textPrimary,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Soft glow */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-15%",
          width: "60%",
          height: "100%",
          background:
            "radial-gradient(ellipse at center, rgba(201,168,124,0.12) 0%, transparent 60%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Nav */}
      <div
        style={{
          padding: mobile ? "12px 14px" : "22px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: mobile ? 13 : 18,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          Nailart<span style={{ color: wt.accent }}>.</span>studio
        </div>
        {!mobile && (
          <div
            style={{
              display: "flex",
              gap: 24,
              fontSize: 13,
              color: wt.textMuted,
              fontWeight: 500,
            }}
          >
            <span>Leistungen</span>
            <span>Galerie</span>
            <span>Termin buchen</span>
          </div>
        )}
      </div>

      {/* Hero */}
      <div
        style={{
          flex: 1,
          padding: mobile ? "16px 14px" : "30px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: mobile ? 8 : 12,
            color: wt.accent,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: mobile ? 6 : 12,
          }}
        >
          Dein Nagelstudio
        </div>
        <div
          style={{
            fontSize: mobile ? 22 : 48,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            marginBottom: mobile ? 8 : 18,
          }}
        >
          Perfektion
          <br />
          bis in die <span style={{ color: wt.accent }}>Spitzen</span>.
        </div>
        <div
          style={{
            fontSize: mobile ? 10 : 15,
            color: wt.textMuted,
            marginBottom: mobile ? 12 : 24,
            maxWidth: mobile ? "100%" : 380,
            lineHeight: 1.5,
            fontWeight: 400,
          }}
        >
          Gel, Acryl, Maniküre & Nail-Art — bei uns bist du in besten Händen.
        </div>
        <div
          style={{
            backgroundColor: wt.accent,
            color: "#fff",
            padding: mobile ? "8px 14px" : "14px 24px",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: mobile ? 10 : 14,
            display: "inline-block",
            width: "fit-content",
            transform: `scale(${pulse})`,
            boxShadow: `0 8px 24px ${wt.accentSoft}`,
          }}
        >
          Termin buchen →
        </div>
      </div>
    </div>
  );
};

// ─── Modern spa / massage ───────────────────────────────────────────────────
export const SpaMock: React.FC<{ frame: number }> = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      background: "linear-gradient(160deg, #F5F0EB 0%, #EDE6DD 100%)",
      color: wt.textPrimary,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Decorative circle */}
    <div
      style={{
        position: "absolute",
        bottom: "-30%",
        right: "-15%",
        width: 380,
        height: 380,
        borderRadius: "50%",
        border: `1px solid ${wt.border}`,
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        padding: "24px 36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 300,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        Serenity
      </div>
      <div
        style={{
          fontSize: 12,
          color: wt.textMuted,
          fontWeight: 500,
        }}
      >
        Spa & Massage
      </div>
    </div>
    <div
      style={{
        flex: 1,
        padding: "0 48px 48px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 68,
          fontWeight: 300,
          lineHeight: 1,
          letterSpacing: -2,
        }}
      >
        Zeit für
        <br />
        <span style={{ fontWeight: 700, color: wt.accent }}>dich</span>.
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 15,
          color: wt.textMuted,
          maxWidth: 340,
          lineHeight: 1.5,
        }}
      >
        Massagen, Wellness & Entspannung — ein Ort der Ruhe mitten in der
        Stadt.
      </div>
      <div style={{ marginTop: 28, display: "flex", gap: 16 }}>
        <div
          style={{
            padding: "14px 24px",
            backgroundColor: wt.accent,
            color: "#fff",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Termin vereinbaren
        </div>
        <div
          style={{
            padding: "14px 24px",
            border: `1px solid ${wt.borderStrong}`,
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 500,
            color: wt.textPrimary,
          }}
        >
          Angebote
        </div>
      </div>
    </div>
  </div>
);

// ─── Modern beauty salon ────────────────────────────────────────────────────
export const BeautySalonMock: React.FC<{ frame: number }> = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      backgroundColor: "#FFFCF8",
      color: wt.textPrimary,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Soft rose glow */}
    <div
      style={{
        position: "absolute",
        top: "-20%",
        left: "-10%",
        width: "60%",
        height: "80%",
        background: `radial-gradient(ellipse at center, ${wt.roseSoft} 0%, transparent 60%)`,
        filter: "blur(60px)",
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        padding: "22px 36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: -0.5,
        }}
      >
        Beauté<span style={{ color: wt.rose }}>.</span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 22,
          fontSize: 13,
          color: wt.textMuted,
          fontWeight: 500,
        }}
      >
        <span>Services</span>
        <span>Team</span>
        <span>Buchen</span>
      </div>
    </div>
    <div
      style={{
        flex: 1,
        padding: "0 48px 40px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: -2,
          marginBottom: 18,
        }}
      >
        Dein Glow
        <br />
        beginnt <span style={{ color: wt.rose }}>hier</span>.
      </div>
      <div
        style={{
          fontSize: 15,
          color: wt.textMuted,
          lineHeight: 1.5,
          maxWidth: 380,
          marginBottom: 24,
        }}
      >
        Haare, Make-up & Beauty-Treatments — alles unter einem Dach.
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          maxWidth: 420,
        }}
      >
        {["Haare", "Make-up", "Wimpern"].map((s) => (
          <div
            key={s}
            style={{
              backgroundColor: wt.surface,
              borderRadius: 12,
              padding: "14px 16px",
              textAlign: "center",
              fontSize: 13,
              fontWeight: 600,
              border: `1px solid ${wt.border}`,
            }}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  </div>
);
