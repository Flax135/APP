---
name: remotion
description: Create, develop, and render programmatic videos with Remotion (React-based video framework). Use when the user wants to generate videos from code, animate React components as video frames, build video templates, or render MP4/WebM/GIF output from a React project. Covers compositions, sequences, animations (interpolate/spring), media (Img/Video/Audio), the CLI (`npx remotion`), Remotion Studio, and programmatic rendering via `@remotion/renderer`.
---

# Remotion Skill

Remotion (https://github.com/remotion-dev/remotion) is a framework for creating videos programmatically using React. Every frame is a React render; the CLI/renderer turns those frames into an actual video file (MP4, WebM, GIF, still image, or audio).

Use this skill whenever the user wants to:
- Scaffold a new Remotion project
- Build compositions, scenes, transitions, or templates
- Animate values with `interpolate`, `spring`, or `useCurrentFrame`
- Compose audio, video, or images into a rendered output
- Render videos via CLI or programmatically from Node.js
- Debug timing/duration/fps/aspect-ratio issues

## Core Mental Model

- **Frames, not seconds.** Everything is measured in frames. Duration = `durationInFrames`. Convert with `frames / fps`.
- **A composition is a video.** `<Composition>` registers a renderable piece: an `id`, a React component, `durationInFrames`, `fps`, `width`, `height`, and optional `defaultProps`.
- **`useCurrentFrame()` drives animation.** Inside a component, call `useCurrentFrame()` and derive styles/values from it. No `setInterval`, no `requestAnimationFrame`.
- **Sequences shift time.** `<Sequence from={30} durationInFrames={60}>` makes its children see frame 0 when the parent is at frame 30, and unmounts them after 60 frames.
- **Deterministic.** Given the same frame + props, output must be identical. Avoid `Date.now()`, `Math.random()` without seed, and un-preloaded async state.

## Project Setup

Scaffold a new project (preferred):

```bash
npx create-video@latest
# or
npm init video
```

Add Remotion to an existing React project:

```bash
npm i remotion @remotion/cli @remotion/renderer
```

Minimum file layout:

```
src/
  index.ts        # registerRoot(RemotionRoot)
  Root.tsx        # <Composition> definitions
  MyVideo.tsx     # the React component being rendered
remotion.config.ts
```

### `src/index.ts`

```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

### `src/Root.tsx`

```tsx
import { Composition } from "remotion";
import { MyVideo } from "./MyVideo";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MyVideo"
    component={MyVideo}
    durationInFrames={150}   // 5s @ 30fps
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ title: "Hello" }}
  />
);
```

## Animating with `useCurrentFrame` + `interpolate`

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const MyVideo: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(frame, [0, 30], [40, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#111", color: "white" }}>
      <h1 style={{ opacity, transform: `translateY(${translateY}px)` }}>
        {title}
      </h1>
    </AbsoluteFill>
  );
};
```

**`interpolate(input, inputRange, outputRange, options?)`**
- Always pass `extrapolateLeft: "clamp"` / `extrapolateRight: "clamp"` unless you explicitly want extrapolation.
- `inputRange` must be monotonically increasing.

## Spring Animations

```tsx
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const scale = spring({
  frame,
  fps,
  from: 0,
  to: 1,
  config: { damping: 12, stiffness: 120, mass: 1 },
});
```

Use `spring()` for natural-feeling entrances; use `interpolate()` for precise, designed timing.

## Sequencing Scenes

```tsx
import { Sequence } from "remotion";

<>
  <Sequence durationInFrames={60}>
    <Intro />
  </Sequence>
  <Sequence from={60} durationInFrames={90}>
    <Main />
  </Sequence>
  <Sequence from={150}>
    <Outro />
  </Sequence>
</>
```

Inside each `<Sequence>`, `useCurrentFrame()` starts at 0 — local time, not global.

## Media

```tsx
import { Img, Video, Audio, staticFile } from "remotion";

<Img src={staticFile("logo.png")} />
<Video src={staticFile("intro.mp4")} />
<Audio src={staticFile("music.mp3")} volume={0.6} />
```

- Put assets in `public/` — `staticFile("name.ext")` resolves to them.
- For remote assets, wrap the composition in `<Composition calculateMetadata={...}>` or preload with `delayRender()` / `continueRender()` so frames wait for data.

## Data-Driven Videos (`defaultProps` + `inputProps`)

Define `defaultProps` on the `<Composition>`, then override per render:

```bash
npx remotion render MyVideo out/video.mp4 \
  --props='{"title":"Dynamic Title","price":"19,99 €"}'
```

Or programmatically (see renderer section).

## Remotion Studio (dev UI)

```bash
npx remotion studio
```

Opens an interactive preview at `http://localhost:3000` with a timeline, props editor, and live reload. Use it as the primary development loop — do not render MP4s while iterating on design.

## Rendering via CLI

```bash
# Full video
npx remotion render <compositionId> out/video.mp4

# Still frame
npx remotion still <compositionId> out/frame.png --frame=60

# With props
npx remotion render MyVideo out/video.mp4 --props='{"title":"Hi"}'

# Quality / codec
npx remotion render MyVideo out/video.mp4 --codec=h264 --crf=18
```

Common flags: `--concurrency`, `--codec` (h264, h265, vp8, vp9, prores, gif), `--crf`, `--image-format`, `--scale`, `--frames=0-59`.

## Rendering Programmatically (`@remotion/renderer`)

For a FastAPI / Node backend that renders on demand:

```ts
import {
  bundle,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import path from "path";

const bundleLocation = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  // webpackOverride: (config) => config,
});

const inputProps = { title: "Deal of the day", price: "49,90 €" };

const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: "MyVideo",
  inputProps,
});

await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: "h264",
  outputLocation: "out/deal.mp4",
  inputProps,
});
```

**Performance tips:**
- Call `bundle()` once at startup (or cache by entry point hash) — it's the expensive step.
- Reuse the `serveUrl` across renders.
- Tune `concurrency` and `chromiumOptions`.
- In Docker/servers, install Chromium deps (Remotion docs: "Lambda" and "Docker" pages).

## `remotion.config.ts`

```ts
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(4);
Config.setOverwriteOutput(true);
Config.setPixelFormat("yuv420p"); // QuickTime-compatible
```

## Debugging Checklist

When a video renders wrong, check in this order:
1. **Composition metadata** — `durationInFrames`, `fps`, `width`, `height` match expectations?
2. **Sequence timing** — is `from` cumulative or relative as you intended?
3. **`interpolate` ranges** — clamped? monotonic input range?
4. **Async data** — wrapped in `delayRender()` / `continueRender()` or `calculateMetadata`?
5. **Determinism** — removed `Date.now()`, unseeded randomness, un-preloaded fonts?
6. **Codec/container** — `yuv420p` pixel format for QuickTime/web compatibility.

## Licensing Note

Remotion has a custom license (free for individuals and small companies, paid Company License for larger teams). If the user is building a commercial product, mention this and link them to https://www.remotion.dev/license.

## Quick Reference

| Need | API |
|---|---|
| Register video | `<Composition id component durationInFrames fps width height defaultProps>` |
| Current frame | `useCurrentFrame()` |
| Video metadata | `useVideoConfig()` → `{ fps, width, height, durationInFrames }` |
| Linear animation | `interpolate(frame, [a,b], [x,y], { extrapolateRight: "clamp" })` |
| Physics animation | `spring({ frame, fps, from, to, config })` |
| Time-shift children | `<Sequence from durationInFrames>` |
| Fullscreen container | `<AbsoluteFill>` |
| Static asset URL | `staticFile("name.ext")` (from `public/`) |
| Delay rendering for async | `delayRender()` / `continueRender(handle)` |
| Dev preview | `npx remotion studio` |
| Render video | `npx remotion render <id> out.mp4` |
| Render still | `npx remotion still <id> out.png --frame=N` |
| Programmatic render | `bundle` + `selectComposition` + `renderMedia` from `@remotion/renderer` |

## Workflow When User Asks for a Video

1. Confirm the target: resolution, fps, duration, whether it's one-off or data-driven.
2. If no Remotion project exists, scaffold with `npx create-video@latest` (ask before installing).
3. Build the composition React-first — get it looking right in `remotion studio`.
4. Only after the design is correct, wire it into the render pipeline (CLI or `@remotion/renderer`).
5. Verify the rendered file opens correctly and has the expected duration (`ffprobe` or VLC).

## Docs

- Main docs: https://www.remotion.dev/docs
- API reference: https://www.remotion.dev/docs/api
- Repo: https://github.com/remotion-dev/remotion
