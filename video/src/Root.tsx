import React from "react";
import { Composition } from "remotion";
import { FlaxAd } from "./FlaxAd";
import { DURATION_FRAMES, FPS } from "./theme";
import { WellnessAd } from "./WellnessAd";
import { W_DURATION, W_FPS } from "./wellnessTheme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── Dark / cinematic FlaxDesigning ad ── */}
      <Composition
        id="FlaxAdVertical"
        component={FlaxAd}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="FlaxAdHorizontal"
        component={FlaxAd}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* ── Wellness / Beauty — light beige ad ── */}
      <Composition
        id="WellnessAdVertical"
        component={WellnessAd}
        durationInFrames={W_DURATION}
        fps={W_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="WellnessAdHorizontal"
        component={WellnessAd}
        durationInFrames={W_DURATION}
        fps={W_FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
