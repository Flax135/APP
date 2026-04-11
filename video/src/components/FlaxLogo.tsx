import React from "react";
import { theme } from "../theme";

type Props = {
  scale?: number;
};

export const FlaxLogo: React.FC<Props> = ({ scale = 1 }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        transform: `scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      <span
        style={{
          fontSize: 64,
          fontWeight: 900,
          color: theme.textPrimary,
          letterSpacing: -3,
          lineHeight: 1,
        }}
      >
        FLAX
      </span>
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: theme.accent,
          marginTop: 26,
          boxShadow: `0 0 28px ${theme.accentGlow}, 0 0 10px ${theme.accent}`,
        }}
      />
      <span
        style={{
          fontSize: 40,
          fontWeight: 400,
          color: theme.textMuted,
          letterSpacing: -0.5,
          lineHeight: 1,
          alignSelf: "flex-end",
          paddingBottom: 4,
        }}
      >
        designing
      </span>
    </div>
  );
};
