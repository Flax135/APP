// Wellness / Beauty ad — warm, calm, beige color palette
// Designed for nail studios, massage parlours, and beauty salons.

const fontFamily =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", ' +
  '"Helvetica Neue", Arial, "Noto Sans", sans-serif';

export const wt = {
  bg: "#FAF6F1",
  bgAlt: "#F3EDE5",
  surface: "#EDE6DD",
  surfaceHi: "#E5DDD3",
  border: "rgba(61,49,35,0.10)",
  borderStrong: "rgba(61,49,35,0.18)",
  textPrimary: "#3D3229",
  textMuted: "#8A7E72",
  accent: "#C9A87C",
  accentAlt: "#D4B88A",
  accentSoft: "rgba(201,168,124,0.18)",
  accentGlow: "rgba(201,168,124,0.35)",
  rose: "#C4787E",
  roseSoft: "rgba(196,120,126,0.12)",
  font: fontFamily,
} as const;

export const W_FPS = 30;
export const W_DURATION = 660; // 22 s @ 30 fps

export const W_SCENES = {
  hook:         { from: 0,   duration: 75  }, //  0.0 –  2.5 s
  pain:         { from: 75,  duration: 75  }, //  2.5 –  5.0 s
  transition:   { from: 150, duration: 120 }, //  5.0 –  9.0 s
  presentation: { from: 270, duration: 150 }, //  9.0 – 14.0 s
  results:      { from: 420, duration: 120 }, // 14.0 – 18.0 s
  cta:          { from: 540, duration: 120 }, // 18.0 – 22.0 s
} as const;
