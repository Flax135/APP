import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { wt, W_SCENES } from "./wellnessTheme";
import { WScene1Hook } from "./scenes/wellness/WScene1Hook";
import { WScene2Pain } from "./scenes/wellness/WScene2Pain";
import { WScene3Transition } from "./scenes/wellness/WScene3Transition";
import { WScene4Presentation } from "./scenes/wellness/WScene4Presentation";
import { WScene5Results } from "./scenes/wellness/WScene5Results";
import { WScene6CTA } from "./scenes/wellness/WScene6CTA";
import { WarmGrain, WarmVignette, GoldenGlow } from "./components/WellnessOverlays";

export const WellnessAd: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: wt.bg,
        fontFamily: wt.font,
        color: wt.textPrimary,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <GoldenGlow />

      <Sequence
        from={W_SCENES.hook.from}
        durationInFrames={W_SCENES.hook.duration}
      >
        <WScene1Hook />
      </Sequence>

      <Sequence
        from={W_SCENES.pain.from}
        durationInFrames={W_SCENES.pain.duration}
      >
        <WScene2Pain />
      </Sequence>

      <Sequence
        from={W_SCENES.transition.from}
        durationInFrames={W_SCENES.transition.duration}
      >
        <WScene3Transition />
      </Sequence>

      <Sequence
        from={W_SCENES.presentation.from}
        durationInFrames={W_SCENES.presentation.duration}
      >
        <WScene4Presentation />
      </Sequence>

      <Sequence
        from={W_SCENES.results.from}
        durationInFrames={W_SCENES.results.duration}
      >
        <WScene5Results />
      </Sequence>

      <Sequence
        from={W_SCENES.cta.from}
        durationInFrames={W_SCENES.cta.duration}
      >
        <WScene6CTA />
      </Sequence>

      <WarmVignette />
      <WarmGrain />
    </AbsoluteFill>
  );
};
