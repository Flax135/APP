import React from "react";
import { wt } from "../wellnessTheme";

// FlaxDesigning logo adapted for light / beige backgrounds
export const WellnessFlaxLogo: React.FC<{ scale?: number }> = ({
  scale = 1,
}) => (
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
        color: wt.textPrimary,
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
        backgroundColor: wt.accent,
        marginTop: 26,
        boxShadow: `0 0 20px ${wt.accentGlow}`,
      }}
    />
    <span
      style={{
        fontSize: 40,
        fontWeight: 400,
        color: wt.textMuted,
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
