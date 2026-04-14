import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { eu, EU_SCENES } from "./euTheme";
import {
  ES1Hook,
  ES2Interrupt,
  ES3WhatIsEU,
} from "./scenes/eu/EUPart1";
import {
  ES4Benefits,
  ES5GermanyProfit,
  ES6Downsides,
} from "./scenes/eu/EUPart2";
import {
  ES7Conflict,
  ES8Mindblow,
  ES9Conclusion,
} from "./scenes/eu/EUPart3";
import {
  DocGrain,
  DocVignette,
  DocSpot,
} from "./components/EUElements";

export const EUVideo: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: eu.bg,
        fontFamily: eu.font,
        color: eu.textPrimary,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <DocSpot />

      <Sequence
        from={EU_SCENES.hook.from}
        durationInFrames={EU_SCENES.hook.duration}
      >
        <ES1Hook />
      </Sequence>

      <Sequence
        from={EU_SCENES.interrupt.from}
        durationInFrames={EU_SCENES.interrupt.duration}
      >
        <ES2Interrupt />
      </Sequence>

      <Sequence
        from={EU_SCENES.whatIsEU.from}
        durationInFrames={EU_SCENES.whatIsEU.duration}
      >
        <ES3WhatIsEU />
      </Sequence>

      <Sequence
        from={EU_SCENES.benefits.from}
        durationInFrames={EU_SCENES.benefits.duration}
      >
        <ES4Benefits />
      </Sequence>

      <Sequence
        from={EU_SCENES.germanyProfit.from}
        durationInFrames={EU_SCENES.germanyProfit.duration}
      >
        <ES5GermanyProfit />
      </Sequence>

      <Sequence
        from={EU_SCENES.downsides.from}
        durationInFrames={EU_SCENES.downsides.duration}
      >
        <ES6Downsides />
      </Sequence>

      <Sequence
        from={EU_SCENES.conflict.from}
        durationInFrames={EU_SCENES.conflict.duration}
      >
        <ES7Conflict />
      </Sequence>

      <Sequence
        from={EU_SCENES.mindblow.from}
        durationInFrames={EU_SCENES.mindblow.duration}
      >
        <ES8Mindblow />
      </Sequence>

      <Sequence
        from={EU_SCENES.conclusion.from}
        durationInFrames={EU_SCENES.conclusion.duration}
      >
        <ES9Conclusion />
      </Sequence>

      <DocVignette />
      <DocGrain />
    </AbsoluteFill>
  );
};
