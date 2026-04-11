import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { SCENES, theme } from "./theme";
import { Scene1Problem } from "./scenes/Scene1Problem";
import { Scene2Pain } from "./scenes/Scene2Pain";
import { Scene3Transition } from "./scenes/Scene3Transition";
import { Scene4Presentation } from "./scenes/Scene4Presentation";
import { Scene5Results } from "./scenes/Scene5Results";
import { Scene6CTA } from "./scenes/Scene6CTA";
import { GrainOverlay, Vignette, LightBeam } from "./components/overlays";
import { AudioTrack } from "./components/AudioTrack";

export const FlaxAd: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        fontFamily: theme.font,
        color: theme.textPrimary,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <LightBeam />

      <Sequence from={SCENES.problem.from} durationInFrames={SCENES.problem.duration}>
        <Scene1Problem />
      </Sequence>

      <Sequence from={SCENES.pain.from} durationInFrames={SCENES.pain.duration}>
        <Scene2Pain />
      </Sequence>

      <Sequence from={SCENES.transition.from} durationInFrames={SCENES.transition.duration}>
        <Scene3Transition />
      </Sequence>

      <Sequence from={SCENES.presentation.from} durationInFrames={SCENES.presentation.duration}>
        <Scene4Presentation />
      </Sequence>

      <Sequence from={SCENES.results.from} durationInFrames={SCENES.results.duration}>
        <Scene5Results />
      </Sequence>

      <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.duration}>
        <Scene6CTA />
      </Sequence>

      <Vignette />
      <GrainOverlay />

      <AudioTrack />
    </AbsoluteFill>
  );
};
