// Use a system font stack so the ad renders offline without downloading
// Google Fonts (which is blocked in hermetic / sandboxed environments).
// The stack prioritises Inter (if the OS has it) and falls back to
// modern system UI fonts, which all look very similar at display weight.
const fontFamily =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", ' +
  '"Helvetica Neue", Arial, "Noto Sans", sans-serif';

export const theme = {
  bg: "#0A0A0B",
  bgAlt: "#111115",
  surface: "#17171C",
  surfaceHi: "#1E1E24",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",
  textPrimary: "#F5F5F7",
  textMuted: "#8A8A92",
  accent: "#3DF0C9",
  accentAlt: "#6DFFE0",
  accentSoft: "rgba(61,240,201,0.22)",
  accentGlow: "rgba(61,240,201,0.35)",
  warning: "#FF5A5F",
  font: fontFamily,
} as const;

export const FPS = 30;
export const DURATION_FRAMES = 660; // 22s total

// Scene offsets in frames (30 fps)
export const SCENES = {
  problem:      { from: 0,   duration: 75  }, //  0.0 –  2.5s  — Hook
  pain:         { from: 75,  duration: 75  }, //  2.5 –  5.0s  — Schmerzpunkt
  transition:   { from: 150, duration: 120 }, //  5.0 –  9.0s  — Lösung
  presentation: { from: 270, duration: 150 }, //  9.0 – 14.0s  — FlaxDesigning
  results:      { from: 420, duration: 120 }, // 14.0 – 18.0s  — Ergebnis
  cta:          { from: 540, duration: 120 }, // 18.0 – 22.0s  — CTA
} as const;

// Audio configuration
// Set `music.enabled = true` once you have dropped your background track
// at `public/music/main.mp3`. See `public/README.md` for details.
// SFX are optional and each can be toggled independently.
export const AUDIO = {
  music: {
    enabled: false,
    file: "music/main.mp3",
    masterVolume: 0.6, // 0..1 — scale the entire envelope
  },
  sfx: {
    impact:  { enabled: false, file: "sfx/impact.mp3",  frame: 12,  volume: 0.9 }, // Scene 1 — text slam
    whoosh:  { enabled: false, file: "sfx/whoosh.mp3",  frame: 150, volume: 0.7 }, // Scene 3 — transition
    riseUp:  { enabled: false, file: "sfx/rise.mp3",    frame: 270, volume: 0.6 }, // Scene 4 — reveal
    ding:    { enabled: false, file: "sfx/ding.mp3",    frame: 495, volume: 0.5 }, // Scene 5 — stat pop
  },
} as const;
