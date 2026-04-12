import React from "react";
import { wt } from "../wellnessTheme";

// ---------- Light browser chrome ----------

type BrowserProps = {
  width?: number | string;
  height?: number | string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  old?: boolean;
  url?: string;
};

export const LightBrowserFrame: React.FC<BrowserProps> = ({
  width = 900,
  height = 560,
  children,
  style,
  old = false,
  url = "flaxdesigning.de",
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: old ? 4 : 18,
      backgroundColor: old ? "#e8e0d8" : "#fff",
      border: `1px solid ${old ? "rgba(0,0,0,0.15)" : wt.border}`,
      boxShadow: old
        ? "4px 4px 0 rgba(0,0,0,0.12)"
        : "0 30px 80px rgba(61,49,35,0.12), 0 0 0 1px rgba(61,49,35,0.04)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      ...style,
    }}
  >
    {/* Top chrome */}
    <div
      style={{
        height: old ? 28 : 40,
        backgroundColor: old ? "#d4ccc4" : wt.bg,
        borderBottom: `1px solid ${old ? "rgba(0,0,0,0.12)" : wt.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 7,
        flexShrink: 0,
      }}
    >
      {!old && (
        <>
          <Dot color="#E8C4C4" />
          <Dot color="#E8DCC4" />
          <Dot color="#C4E8D0" />
        </>
      )}
      <div
        style={{
          marginLeft: old ? 0 : 24,
          flex: 1,
          height: old ? 18 : 24,
          backgroundColor: old ? "#fff" : "rgba(61,49,35,0.04)",
          borderRadius: old ? 2 : 6,
          border: old ? "1px solid #aaa" : "none",
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          fontSize: old ? 11 : 12,
          color: old ? "#555" : wt.textMuted,
          fontFamily: old ? "'Courier New', monospace" : wt.font,
          fontWeight: 500,
        }}
      >
        {old ? `http://www.${url}/index.html` : url}
      </div>
    </div>
    <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
      {children}
    </div>
  </div>
);

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <div
    style={{
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: color,
    }}
  />
);

// ---------- Light phone frame ----------

type PhoneProps = {
  width?: number;
  height?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

export const LightPhoneFrame: React.FC<PhoneProps> = ({
  width = 280,
  height = 580,
  children,
  style,
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: 44,
      backgroundColor: wt.surfaceHi,
      border: `6px solid ${wt.surface}`,
      padding: 5,
      boxShadow:
        "0 30px 80px rgba(61,49,35,0.15), 0 0 0 1px rgba(61,49,35,0.06)",
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 36,
        backgroundColor: "#fff",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Dynamic island */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          width: 80,
          height: 24,
          borderRadius: 14,
          backgroundColor: wt.surfaceHi,
          zIndex: 10,
        }}
      />
      {children}
    </div>
  </div>
);
