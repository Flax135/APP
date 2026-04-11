import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { AUDIO, DURATION_FRAMES } from "../theme";

// =============================================================================
// Audio Track
// =============================================================================
// Orchestrates the background music with a cinematic volume envelope that
// follows the story beats, plus optional SFX hits at key moments.
//
// The main track fades in during the hook (kept low so the text slam cuts
// through), rises through Scenes 2–4, peaks during Results, and gently
// fades out at the CTA.
//
// Everything is opt-in via `theme.ts` → `AUDIO` so rendering works out of
// the box even before you add audio files.
// =============================================================================

export const AudioTrack: React.FC = () => {
  return (
    <>
      {AUDIO.music.enabled && (
        <Audio
          src={staticFile(AUDIO.music.file)}
          volume={(frame) => musicEnvelope(frame) * AUDIO.music.masterVolume}
        />
      )}

      {/* One-shot SFX — mounted as tiny sequences at precise frames */}
      {AUDIO.sfx.impact.enabled && (
        <Sequence from={AUDIO.sfx.impact.frame} durationInFrames={30}>
          <Audio
            src={staticFile(AUDIO.sfx.impact.file)}
            volume={AUDIO.sfx.impact.volume}
          />
        </Sequence>
      )}

      {AUDIO.sfx.whoosh.enabled && (
        <Sequence from={AUDIO.sfx.whoosh.frame} durationInFrames={45}>
          <Audio
            src={staticFile(AUDIO.sfx.whoosh.file)}
            volume={AUDIO.sfx.whoosh.volume}
          />
        </Sequence>
      )}

      {AUDIO.sfx.riseUp.enabled && (
        <Sequence from={AUDIO.sfx.riseUp.frame} durationInFrames={60}>
          <Audio
            src={staticFile(AUDIO.sfx.riseUp.file)}
            volume={AUDIO.sfx.riseUp.volume}
          />
        </Sequence>
      )}

      {AUDIO.sfx.ding.enabled && (
        <Sequence from={AUDIO.sfx.ding.frame} durationInFrames={30}>
          <Audio
            src={staticFile(AUDIO.sfx.ding.file)}
            volume={AUDIO.sfx.ding.volume}
          />
        </Sequence>
      )}
    </>
  );
};

// =============================================================================
// Volume envelope — piecewise linear, tuned to the 6-scene story beats.
// Input: frame (0..660). Output: volume multiplier (0..1).
// =============================================================================
const musicEnvelope = (frame: number): number => {
  // Keypoints: [frame, volume]
  const points: Array<[number, number]> = [
    [0,    0.0],  // silence
    [8,    0.30], // quick fade-in during hook — stays low so text slam hits
    [50,   0.32], // still quiet through hook hold
    [80,   0.42], // rise into Scene 2 (pain)
    [155,  0.55], // rise into Scene 3 (transition) — momentum builds
    [275,  0.70], // Scene 4 (presentation) — full energy
    [425,  0.85], // Scene 5 (results) — peak
    [540,  0.78], // slight duck into Scene 6 (CTA) so tagline breathes
    [610,  0.78], // hold through CTA
    [DURATION_FRAMES - 2, 0.0], // fade to silence
  ];

  // Find the segment the frame falls into
  for (let i = 0; i < points.length - 1; i++) {
    const [fa, va] = points[i];
    const [fb, vb] = points[i + 1];
    if (frame >= fa && frame <= fb) {
      const t = (frame - fa) / (fb - fa);
      return va + (vb - va) * t;
    }
  }
  return 0;
};
