# ASD-sim

ASD-sim is a public, advocacy-forward awareness simulator for education and knowledge sharing.

It is designed to help people discuss how communication and sensory-motor interference can affect autistic non-speakers and others with similar experiences. It is a perspective-building approximation inspired by reported lived experiences, not an exact reproduction of any one person.

## Framing and Boundaries

- Educational and advocacy-oriented.
- Not a game and not entertainment-focused.
- Not a medical tool, diagnostic tool, or treatment system.
- Does not claim medical accuracy or exact recreation of internal experience.
- Does not imply that all autistic non-speakers share one profile.

## MVP Scope

- Static front-end app deployable to GitHub Pages.
- No backend, no user accounts, no analytics.
- Global slider controls for five channels:
  - Apraxia / motor-planning difficulty
  - Need to stim / involuntary movement disruption
  - Hearing distortions
  - Vision distortions
  - Synesthesia-inspired cross-sensory interference
- Four modular tests:
  - Symbol Selection Test (AAC-inspired generic symbol grid)
  - Color Selection Test
  - Object/Color/Shape Recognition Test
  - Timed Focus/Response Test
- Query-string preset support:
  - Named preset: `?preset=lucas`
  - Explicit levels: `?apraxia=70&hearing=40&vision=60&stim=50&synesthesia=30`

## Recommended Stack

- `Vite` + `React` + `TypeScript`
- `react-router-dom` with `HashRouter` (GitHub Pages friendly)
- CSS-only styling/effects for a static deployment footprint

This stack was chosen for low overhead, modularity, and straightforward GitHub Pages deployment.

## Architecture and Module Breakdown

```text
src/
  components/
    ChannelReadout.tsx
    SimulationControls.tsx
    SliderPanel.tsx
    TestSelector.tsx
    VisualEffectsLayer.tsx
    WarningPanel.tsx
  config/
    channels.ts
  engines/
    audioEngine.ts
    interactionEngine.ts
    visualEffectsEngine.ts
  pages/
    HomePage.tsx
    SetupPage.tsx
    SimulationPage.tsx
    DebriefPage.tsx
    AboutPage.tsx
  state/
    SimulationContext.tsx
  tests/
    ColorSelectionTest.tsx
    SymbolSelectionTest.tsx
    RecognitionTest.tsx
    TimedFocusTest.tsx
    TestTypes.ts
    index.ts
  types/
    simulation.ts
  utils/
    presets.ts
  App.tsx
  main.tsx
  index.css
.github/workflows/
  deploy-pages.yml
```

### Module Responsibilities

- App shell/routing: `src/App.tsx`, `src/main.tsx`
- Slider state/config: `src/state/SimulationContext.tsx`, `src/config/channels.ts`
- Test engine registry: `src/tests/index.ts`
- Audio engine: `src/engines/audioEngine.ts`
- Visual effects engine: `src/engines/visualEffectsEngine.ts`
- Interaction disruption engine: `src/engines/interactionEngine.ts`
- Query-string preset loader: `src/utils/presets.ts`
- Live in-simulation slider tuning: `src/pages/SimulationPage.tsx` + `src/components/SliderPanel.tsx`

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build production bundle:

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## GitHub Pages Deployment

The repository includes `.github/workflows/deploy-pages.yml`.

1. In GitHub repo settings, enable **Pages** and set source to **GitHub Actions**.
2. Push to `main`.
3. The workflow builds `dist/` and deploys it to GitHub Pages.

### Base Path

`vite.config.ts` defaults to:

```ts
base: process.env.VITE_BASE_PATH || '/ASD-sim/'
```

If repo path changes, set `VITE_BASE_PATH` accordingly.

## Query-string Presets

ASD-sim reads both direct URL query and hash-route query.

Examples:

- `https://<host>/<path>/#/setup?preset=lucas`
- `https://<host>/<path>/#/setup?apraxia=70&hearing=40&vision=60&stim=50&synesthesia=30`

Explicit channel params override named preset defaults.

## Audio and Safety Notes

- The app provides warnings before simulation.
- Users are prompted to lower/adjust speaker or headphone volume before starting.
- A visible mute/unmute control is available in simulation view.
- The simulator remains usable without audio.

## Important Interaction Constraint

ASD-sim does **not** move or interfere with the user’s real system cursor.

Interaction interference is modeled only inside the simulated environment using target drift, timing mismatch, unstable activation behavior, and layered visual/audio disruption.
