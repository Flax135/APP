// Documentary-style EU video — dark navy with EU blue + gold accents
const fontFamily =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", ' +
  '"Helvetica Neue", Arial, "Noto Sans", sans-serif';

export const eu = {
  bg: "#0A0E1A",
  bgAlt: "#0F1523",
  surface: "#151C2E",
  surfaceHi: "#1D2638",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",
  textPrimary: "#EEEEEE",
  textMuted: "#8A94A8",
  textDim: "#5A6278",
  euBlue: "#003399",
  euBlueLight: "#4A8FDC",
  euGold: "#FFCC00",
  euGoldSoft: "rgba(255,204,0,0.18)",
  accent: "#5BA3E8",
  accentSoft: "rgba(91,163,232,0.18)",
  warning: "#E54B4B",
  warningSoft: "rgba(229,75,75,0.18)",
  success: "#4ADE80",
  deBlack: "#0A0A0A",
  deRed: "#DD0000",
  deGold: "#FFCE00",
  font: fontFamily,
} as const;

export const EU_FPS = 30;
// 3:00 minutes (5400 frames) — within the requested 3-4 min range
export const EU_DURATION = 5400;

// Scene offsets (in frames @ 30 fps)
export const EU_SCENES = {
  hook:          { from: 0,    duration: 210  }, //  0:00 – 0:07
  interrupt:     { from: 210,  duration: 210  }, //  0:07 – 0:14
  whatIsEU:      { from: 420,  duration: 600  }, //  0:14 – 0:34
  benefits:      { from: 1020, duration: 780  }, //  0:34 – 1:00
  germanyProfit: { from: 1800, duration: 1140 }, //  1:00 – 1:38
  downsides:     { from: 2940, duration: 1080 }, //  1:38 – 2:14
  conflict:      { from: 4020, duration: 600  }, //  2:14 – 2:34
  mindblow:      { from: 4620, duration: 420  }, //  2:34 – 2:48
  conclusion:    { from: 5040, duration: 360  }, //  2:48 – 3:00
} as const;
