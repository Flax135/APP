import React from "react";
import { theme } from "../theme";

type Props = {
  width?: number | string;
  height?: number | string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  old?: boolean;
  url?: string;
};

export const BrowserFrame: React.FC<Props> = ({
  width = 900,
  height = 560,
  children,
  style,
  old = false,
  url = "flaxdesigning.de",
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: old ? 0 : 16,
        backgroundColor: old ? "#d0d0c8" : theme.surface,
        border: `1px solid ${old ? "#888" : theme.border}`,
        boxShadow: old
          ? "6px 6px 0 rgba(0,0,0,0.4)"
          : "0 40px 120px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Top chrome */}
      <div
        style={{
          height: old ? 30 : 44,
          backgroundColor: old ? "#b8b8a8" : "rgba(255,255,255,0.03)",
          borderBottom: `1px solid ${old ? "#666" : theme.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {!old && (
          <>
            <Dot color="#FF5F57" />
            <Dot color="#FEBC2E" />
            <Dot color="#28C840" />
          </>
        )}
        <div
          style={{
            marginLeft: old ? 0 : 28,
            flex: 1,
            height: old ? 20 : 26,
            backgroundColor: old ? "#fff" : "rgba(255,255,255,0.05)",
            borderRadius: old ? 0 : 6,
            border: old ? "2px inset #888" : "none",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            fontSize: old ? 12 : 13,
            color: old ? "#333" : theme.textMuted,
            fontFamily: old ? "'Courier New', monospace" : theme.font,
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
};

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <div
    style={{
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: color,
    }}
  />
);
