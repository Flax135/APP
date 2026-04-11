# public/ — Audio assets

Remotion resolves everything in this folder via `staticFile("...")`. Drop your
audio files here and flip the switches in `src/theme.ts` → `AUDIO`.

## 1. Background music (required for audio)

**Path:** `public/music/main.mp3`
**Length:** ≥ 22 seconds (anything longer is automatically trimmed by the fade-out)
**Format:** MP3 or WAV (44.1 kHz / 48 kHz, stereo)

### Style guide — what the ad needs

The visual is dark, cinematic, modern, mildly dramatic, with an uplifting
second half. Pick a track that matches:

- **Mood:** cinematic, confident, uplifting, mild tension in the first 5 s
- **Energy curve:** slow-burn intro → rising build → peak around 14–18 s → resolve
- **Tempo:** 90–120 BPM
- **Instruments:** cinematic piano / synth pad / subtle percussion / soft sub
  bass / risers. **Avoid** vocals and anything too "busy"
- **Mix:** leave headroom — the code drives volume to ~0.85 peak, so the track
  should be mastered but not slammed (target −10 LUFS integrated or lower)

### Where to get it (royalty-free, commercial-use-ok)

- **Pixabay Music** — https://pixabay.com/music/ — free, no attribution, search
  *"cinematic corporate uplifting"*
- **Uppbeat** — https://uppbeat.io/ — generous free tier, commercial-safe
- **Free Music Archive** — https://freemusicarchive.org/ — CC-licensed
- **YouTube Audio Library** — https://www.youtube.com/audiolibrary — free, no
  attribution required for most tracks
- **Artlist** / **Epidemic Sound** — paid, highest quality

Search terms that work well: *"cinematic tech",* *"modern corporate uplifting",*
*"brand inspire",* *"motivational future",* *"tech startup"*.

## 2. Optional SFX (one-shots)

| File                       | Triggered at           | Purpose                                        |
| -------------------------- | ---------------------- | ---------------------------------------------- |
| `public/sfx/impact.mp3`    | Frame 12 (Scene 1)     | Text slam — deep cinematic hit / boom          |
| `public/sfx/whoosh.mp3`    | Frame 150 (Scene 3)    | Transition — fast swoosh between old → new     |
| `public/sfx/rise.mp3`      | Frame 270 (Scene 4)    | Logo reveal — rising riser / build             |
| `public/sfx/ding.mp3`      | Frame 495 (Scene 5)    | Stat pop — short UI confirm chime              |

All SFX are optional and each is individually toggled via
`AUDIO.sfx.*.enabled` in `src/theme.ts`. Without SFX the music alone carries
the ad nicely.

Good free SFX sources:

- **Freesound** — https://freesound.org/ — huge CC-licensed library
- **Pixabay SFX** — https://pixabay.com/sound-effects/
- **Mixkit** — https://mixkit.co/free-sound-effects/

## 3. Enabling audio

Once your files are in place, open `src/theme.ts` and flip the flags:

```ts
export const AUDIO = {
  music: {
    enabled: true,                 // ← turn on
    file: "music/main.mp3",
    masterVolume: 0.6,
  },
  sfx: {
    impact:  { enabled: true, ... }, // ← turn on the ones you added
    whoosh:  { enabled: true, ... },
    riseUp:  { enabled: false, ... },
    ding:    { enabled: false, ... },
  },
} as const;
```

Re-run `npm run studio` — you'll hear the soundtrack ducked per-scene, with
your SFX hitting at the text slam, the transition, the logo reveal and the
stat pop.

## 4. Volume envelope (reference)

The music ducks and rises along this curve — see `src/components/AudioTrack.tsx`
if you want to tweak it:

```
frame   0    8   80  155  275  425  540  610  658
vol   0.00 0.30 0.42 0.55 0.70 0.85 0.78 0.78 0.00
scene   ───hook───pain──trans──pres──results──CTA──
```

Volumes are multiplied by `AUDIO.music.masterVolume` (default `0.6`), so to
make the whole track quieter or louder globally, tweak that one number.

## 5. Rendering audio

Remotion handles audio automatically during `render` — no extra flags needed.
Both `npm run render:vertical` and `npm run render:horizontal` will mux the
final MP4 with the soundtrack.

If you only want a silent render (for testing), leave `AUDIO.music.enabled`
as `false`.
