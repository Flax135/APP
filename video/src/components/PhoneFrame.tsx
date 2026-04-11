import React from "react";
import { theme } from "../theme";

type Props = {
  width?: number;
  height?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

export const PhoneFrame: React.FC<Props> = ({
  width = 280,
  height = 580,
  children,
  style,
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 44,
        backgroundColor: "#000",
        border: "8px solid #1a1a1e",
        padding: 6,
        boxShadow:
          "0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 36,
          backgroundColor: theme.bgAlt,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Dynamic island / notch */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 96,
            height: 26,
            borderRadius: 16,
            backgroundColor: "#000",
            zIndex: 10,
          }}
        />
        {children}
      </div>
    </div>
  );
};
