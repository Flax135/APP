import React from "react";
import { Composition } from "remotion";
import { FlaxAd } from "./FlaxAd";
import { DURATION_FRAMES, FPS } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
    </>
  );
};
