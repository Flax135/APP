# FlaxDesigning Ad — Remotion Project

Cinematic, programmatically-rendered advertising video for **FlaxDesigning**, built with [Remotion](https://www.remotion.dev).

Two compositions are shipped:

| ID                  | Format     | Resolution  | Use case          |
| ------------------- | ---------- | ----------- | ----------------- |
| `FlaxAdVertical`    | Hochformat | 1080 × 1920 | TikTok / Reels / Shorts |
| `FlaxAdHorizontal`  | Querformat | 1920 × 1080 | YouTube / Web / Ads     |

Both run **22 seconds @ 30 fps** (660 frames) and share the same 6-scene story:

| # | Szene           | Frames   | Zeit        | Inhalt                                                       |
| - | --------------- | -------- | ----------- | ------------------------------------------------------------ |
| 1 | Hook            |   0–75   | 0.0–2.5 s   | "Deine Website **kostet** dich Kunden."                      |
| 2 | Schmerzpunkt    |  75–150  | 2.5–5.0 s   | "Menschen entscheiden in Sekunden." + 94 % Bounce-Grid       |
| 3 | Übergang        | 150–270  | 5.0–9.0 s   | Alte Seite zerfällt, moderne Seite + Phone-Mockup erscheint  |
| 4 | Präsentation    | 270–420  | 9.0–14.0 s  | FlaxDesigning-Logo + 3 Browser-Fan-In                        |
| 5 | Ergebnis        | 420–540  | 14.0–18.0 s | Zählende Stat-Cards + "Mehr Sichtbarkeit. Mehr Vertrauen. Mehr Umsatz." |
| 6 | CTA             | 540–660  | 18.0–22.0 s | "Bring dein Business aufs nächste Level." + **ab 250 €** + **Angebot kostenlos** |

## Setup

Voraussetzung: **Node.js ≥ 18**.

```bash
cd video
npm install
```

Der erste `npm install` lädt Remotion, React, die Inter-Font-Familie und Chromium für den Renderer.

## Entwickeln — Remotion Studio

```bash
npm run studio
```

Öffnet das Remotion Studio auf `http://localhost:3000`. Dort kannst du:

- Zwischen `FlaxAdVertical` und `FlaxAdHorizontal` umschalten
- Per Timeline scrubben und einzelne Szenen live tweaken
- Props (z. B. Farben in `src/theme.ts`) anpassen und sofort sehen

## Rendern — Videos erzeugen

```bash
# Nur Hochformat (TikTok/Reels)
npm run render:vertical

# Nur Querformat (YouTube/Web)
npm run render:horizontal

# Beide Formate nacheinander
npm run render:all
```

Output landet in `video/out/`:

- `out/flaxdesigning-vertical.mp4`   (1080×1920, H.264, CRF 18)
- `out/flaxdesigning-horizontal.mp4` (1920×1080, H.264, CRF 18)

Render-Einstellungen (`yuv420p`, H.264, CRF 18) sind in `remotion.config.ts` definiert und erzeugen QuickTime- und Web-kompatible MP4s in hoher Qualität.

## Projektstruktur

```
video/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── src/
│   ├── index.ts              # registerRoot
│   ├── Root.tsx              # <Composition> Definitionen
│   ├── theme.ts              # Farben, Schrift, Timing-Konstanten
│   ├── FlaxAd.tsx            # Haupt-Orchestrator (Sequences)
│   ├── components/
│   │   ├── BrowserFrame.tsx  # Mac-ähnliches Browser-Chrome (alt + modern)
│   │   ├── PhoneFrame.tsx    # iPhone-ähnlicher Rahmen mit Dynamic Island
│   │   ├── FlaxLogo.tsx      # FLAX.designing Wortmarke
│   │   ├── SiteMocks.tsx     # ModernHero, Ecommerce, Portfolio, OldSite
│   │   └── overlays.tsx      # Grain, Vignette, Light Beam
│   └── scenes/
│       ├── Scene1Problem.tsx
│       ├── Scene2Pain.tsx
│       ├── Scene3Transition.tsx
│       ├── Scene4Presentation.tsx
│       ├── Scene5Results.tsx
│       └── Scene6CTA.tsx
└── out/                      # gerenderte MP4s (gitignored)
```

## Design-System

Definiert in `src/theme.ts`:

| Token          | Wert          | Zweck                      |
| -------------- | ------------- | -------------------------- |
| `bg`           | `#0A0A0B`     | Haupt-Hintergrund (fast schwarz) |
| `surface`      | `#17171C`     | Karten, Frames             |
| `accent`       | `#3DF0C9`     | Electric Mint – Hauptakzent |
| `accentAlt`    | `#6DFFE0`     | Akzent-Verlauf             |
| `warning`      | `#FF5A5F`     | "kostet", Bounce-Rate      |
| `textPrimary`  | `#F5F5F7`     | Haupttext                  |
| `textMuted`    | `#8A8A92`     | Subtext, Captions          |
| `font`         | Inter         | Geladen via @remotion/google-fonts |

## Anpassen

- **Farben** → `src/theme.ts`
- **Timing / Szenenlänge** → `SCENES` in `src/theme.ts` und `DURATION_FRAMES`
- **Texte** → jeweilige `Scene*.tsx`
- **Preise / CTA** → `Scene6CTA.tsx` (aktuell: `ab 250 €` + `Angebot kostenlos`)
- **Logo** → `src/components/FlaxLogo.tsx`
- **Mock-Designs** → `src/components/SiteMocks.tsx`

## Render-Tipps

- Für einen **Teaser-Still** (Cover-Bild für Social Posts):
  ```bash
  npm run still:cover
  # → out/cover.png (1920x1080, Frame 585, kurz vor dem CTA-Peak)
  ```
- Höhere Qualität: `--crf=14` (größer, schärfer) oder ProRes mit `--codec=prores --prores-profile=hq`.
- Anderes Frame pro Sekunde → in `src/theme.ts` `FPS` anpassen und `DURATION_FRAMES` entsprechend umrechnen.

## Hinweise

- Der gesamte Ad ist **typografie- und UI-basiert** — kein Stock-Footage, alles React/CSS. Dadurch wirkt es wie ein Agentur-Brand-Film, bleibt komplett editierbar und ist nicht als KI-Video erkennbar.
- Grain, Vignette und der langsame Light-Beam laufen durchgehend und geben dem Ganzen den cinematischen Look.
- Die ersten 3 Sekunden (Szene 1) sind mit Fast-Zoom + Text-Slam + Farb-Highlight bewusst als Scroll-Stopper designt.
