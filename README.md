# Wheel-being: la roue du bien-être

**Rendez-vous with inspiration, s'il vous plaît!**

![Banner Image](<img/la-roue-de-la-fortune-mb-game.png> "A board game from the 90s - la roue de la fortune.").<br>*[L'argent ne fait pas le bonheur](https://fr.wiktionary.org/wiki/l%E2%80%99argent_ne_fait_pas_le_bonheur) - French idiom.*

## Genesis

> There’s that sweet moment before every big thing, before the commitment. When nothing’s started yet and everything still shines with an if, or a maybe. You don’t know what’s coming, not really, but the road is there. All ahead of you. So you hit the highway of your own thoughts and confusion intertwines with freedom. Then, suddenly, there it is: [crush](https://www.youtube.com/watch?v=5VJmR87-QbY)! This [one](https://www.nature.com/nature-index/news/data-visualization-these-are-the-happiest-countries-world-happiness-report-twenty-nineteen) actually.

This [interactive data-story](https://hyperphantasia.github.io/wheel-being/) helps visualizing wellbeing across European countries from 2004 to 2024. Built with TypeScript and [D3.js](https://d3js.org), it has been crafted for and during the [Hackaviz 2026](https://toulouse-dataviz.fr/hackaviz/2026-contest/) competition.

## Table of contents

<details>
<summary>Contents - click to expand</summary>

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Data source](#data-source)
- [Best practices applied](#best-practices-applied)
- [Accessibility](#accessibility)
- [Browser support](#browser-support)
- [Known limitations & future improvements](#known-limitations--future-improvements)
- [Contributing](#contributing)
- [License](#license)

</details>

## Features

- **Synoptic visualization**: each country is a wedge with a wedge radius that is an aggregate happiness index. Wedge segments encode color-differentiated socio-economic sub-indicators.
- **Guidance**: a multi-stage narrative auto-advances (once) and can be replayed with navigation arrows.
- **Year scrubbing & auto-play** roll through two decades manually, or let it play automatically.
- **Country selection** Pin a specific country and see its detail in the center readout.
- **A cluster mode** outlines each country by its *economic* cluster.
- **Perception mode** overlays an extra arc showing how *perceived* (subjective) happiness compares to the measured index.
- **Screen-reader-friendly data table**: accessible hidden, always-in-sync tabular equivalent of whatever year is on screen. For users who can't consume the radial chart visually.

## Tech stack

- **TypeScript** compiled to native ES modules with `tsc` (no bundler)
- [**D3.js v7**](https://d3js.org) loaded via CDN at runtime and typed at compile time via `@types/d3`
- Plain **CSS**: custom properties, no preprocessor
- **Zero runtime dependencies**. The shipped app is static files. TypeScript/`@types/d3` are dev-only, needed to *build*, not to *run*

## Getting started

The app itself is static files (`index.html` + compiled `dist/*.js` + `css/` + `data/`) and needs no dependencies to *run*. Building it from the TypeScript source needs Node once, to compile.

**Prerequisite:**

Make sure [Node.js](https://nodejs.org/fr/download) (version 20+) is available on your system

**Build and run:**

```bash
npm install        # installs typescript + @types/d3 (dev-only)
npm run build       # compiles src/**.ts -> dist/**.js
npm run serve       # serves the app on http://localhost:8080

# or, both at once:
npm start
```

`dist/` is generated and gitignored. Run `npm run build` after cloning, or after any edit to `src/`.

> [!TIP]
> Use `npm run watch` to recompile automatically while developing.

Because the app uses native ES modules (`<script type="module">`) and fetches the dataset via `fetch`, it must be served over HTTP(S). Opening `index.html` directly from the filesystem (`file://`) will not work in most browsers.

A prebuilt `dist/` is included in the [release](https://github.com/hyperphantasia/wheel-being/releases) zip, so `npm run serve` alone (no build step) is enough if you just want to run it as-is.

**Note:** releases are created only when you push with a git tag:

```bash
git tag v1.0.0
git push --tags
```

## Deploying to GitHub Pages

A workflow is included at `.github/workflows/deploy.yml`.

1. It installs dependencies, type-checks and compiles the TypeScript (`npm run build`)
2. Assembles the static site (`index.html`, `css/`, `data/`, `dist/`) and publishes it via GitHub's official Pages deployment action
3. Ships a release, so the app can be run as-is (avoids the `npm` building step).

No `gh-pages` branch, no personal access token, and no manual build/upload is required.

**Prerequisite:**

1. In the repo's **Settings → Pages**.
2. Under **Build and deployment → Source**, make sure **"GitHub Actions"** is selected (not "Deploy from a branch").
3. Push to `main` (or run the workflow manually from the **Actions** tab → *Deploy to GitHub Pages* → **Run workflow**).

The first push to `main` after that will trigger the workflow automatically. Once it finishes, the site is live at:

```text
https://<username>.github.io/<repo-name>/
```

**Why this approach instead of a `gh-pages` branch?**

1. GitHub's `actions/upload-pages-artifact` + `actions/deploy-pages` is the current recommended method: it deploys straight from the build artifact via OIDC, so there's no branch to keep in sync and no token to manage.
2. No config changes needed: all paths in `index.html` are relative (`css/styles.css`, `dist/main.js`, `data/final_wellbeing_dataset.csv`), so the site works correctly whether it's served at a domain root or under a project subpath like the URL above.

If you specifically want the classic `gh-pages` branch approach instead (to also serve the site outside of GitHub Pages), in `deploy.yaml` swap the `upload Pages artifact` and `actions/deploy-pages@v4` of the workflow for [`peaceiris/actions-gh-pages`](https://github.com/peaceiris/actions-gh-pages), pointed at the same `_site` folder.

## Project structure

```text
wheel-of-wellbeing/
├── .github/
│   └── workflows/
│       └── deploy.yml           GitHub Actions: build + deploy to GitHub Pages
├── index.html                  Entry point: markup, meta tags, a11y hooks (loads dist/main.js)
├── css/
│   └── styles.css              All visual styling (tokens, layout, chart primitives, a11y utilities)
├── data/
│   └── final_wellbeing_dataset.csv
├── src/                         TypeScript source (edit this)
│   ├── main.ts                  App entry point: boot sequence + control wiring
│   ├── config.ts                Static config: stage copy, colors, dimensions, clusters
│   ├── state.ts                 Single shared mutable state object (+ AppState type)
│   ├── dom.ts                   Cached, precisely-typed DOM/d3-selection references
│   ├── dataService.ts           CSV loading + parsing + year-indexing
│   ├── utils.ts                 Small shared helpers (formatting, motion, interaction gating)
│   ├── tooltip.ts               Floating tooltip (content + positioning + auto-hide)
│   ├── legend.ts                Main legend, cluster legend, perception legend
│   ├── story.ts                 Stage/narrative controller (year nav, stage transitions, auto-play)
│   ├── types.ts                 Shared domain types (CountryRow, Stage, ChartScales, ...)
│   ├── types/
│   │   └── global.d.ts          Declares the runtime-global `d3` (loaded via CDN, not imported)
│   └── chart/
│       ├── setup.ts             Builds the persistent SVG layers + glow filters (once)
│       ├── index.ts             Per-year render orchestrator (computes shared scales)
│       ├── grid.ts               Concentric reference rings
│       ├── clock.ts              Center "clock" tick marks
│       ├── centerInfo.ts         Animated year/country/score readout
│       ├── labels.ts             Rotated country name labels
│       ├── arcs.ts               Core stacked-arc renderer + interactions (the big one)
│       └── accessibility.ts      Screen-reader data table + live status announcements
├── tsconfig.json                 Strict compiler config, targets native browser ESM
├── package.json                 Build/serve scripts + dev-only type dependencies
├── package-lock.json            CI deterministic install
├── .editorconfig
├── .gitignore
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── README.md                    You are here Θ_Θ
└── LICENSE                      CC0 1.0
```

If you're new to the codebase, start at `src/main.ts` and follow the imports. Every module in `src/` has a short JSDoc header explaining its responsibility.

> [!NOTE]
> Edit files in `src/`, never in `dist/`!
> `dist/` is fully regenerated by `tsc` and any manual changes there will be *silently* overwritten on the next build.

## How it works

1. **`main.ts`** builds the static SVG layer structure (`chart/setup.ts`), loads and indexes the CSV (`dataService.ts`), wires up every button/toggle, then kicks off the intro stage and a one-time auto-advance schedule.
2. **`story.ts`** owns *when*: which of the four stages is active, which year is on screen, and the transitions between them.
3. **`chart/index.ts`** owns *what gets drawn*: given a year's rows, it computes the shared angle/radius scales once and delegates to the grid, clock, labels, and arc sub-renderers.
4. **`chart/arcs.ts`** is the heart of the visual: for each country it builds a stack of  multiple sub-indicator segments, plus optional cluster-outline and perception-overlay arcs. It also owns all hover/click/keyboard interaction.
5. **`state.ts`** is the single source of truth for anything mutable (current year, selected country, active modes, etc.), typed via the `AppState` interface. Every other module reads/writes it directly rather than passing state through long call chains.

## Data source

`data/final_wellbeing_dataset.csv` contains one row per country per year (2004-2024) with these important features:

- `Happiness_Index`: the aggregate wellbeing score driving each wedge's radius
- `Subjective_Index` is a self-reported/perceived happiness (used by perception mode)
- Ten socio-economic sub-indicators (income, employment, housing, work-life balance, health, environment, social connections, civic engagement, safety, education) that make up each wedge's stacked segments.

A methodology note is [available](https://github.com/hyperphantasia/wheel-being/blob/main/methodology.md).

## Best practices applied

This refactor deliberately applies practices from several disciplines. Named explicitly, as requested:

<details>
<summary>Contents - click to expand</summary>

**Type safety**

- **Strict TypeScript** (`strict: true`) across the entire codebase:  every function signature, DOM/d3 selection and data shape is typed. This catches a whole class of bugs (typos in property names, wrong argument order, `undefined` not handled) at compile time instead of at runtime in the browser.

- **Domain types as documentation**: `types.ts` defines only once `CountryRow`, `Stage`, `ClusterDefinition`, `ChartScales`, etc. Every module imports and reuses them instead of relying on implicit object shapes.

- **Precisely-typed DOM/d3 selections**: `dom.ts` types each cached selection with its real element type (e.g. `Selection<HTMLInputElement, ...>` for a checkbox), so calling the wrong method on the wrong element is a compile error, not a silent runtime no-op.

- **Type-only imports for the global `d3`**: `d3` is still loaded via CDN at runtime (not bundled), but is fully typed at compile time via `@types/d3`. Type imports are erased during compilation so they add zero runtime cost or extra requests.

**Code organization & readability**

- **DRY (Don't Repeat Yourself)**: repeated logics (interaction gating, opacity dimming, tooltip HTML building, per-year data filtering) are a single function called from every site that needs it.

- **Separation of Concerns / Single Responsibility Principle**: one file, one job (data loading vs. rendering vs. narrative logic vs. DOM caching).

- **Modular architecture**: native ES modules with explicit imports/exports make dependencies traceable instead of implicit via shared closure scope.

- **Named constants over magic numbers**: for example, stage indices (`STAGE.DASHBOARD` instead of the raw `3`, typed as the `StageIndex` union) and other repeated literals are named once in `config.ts`.

- **Consistent naming & JSDoc**: every module and non-trivial function has a doc comment explaining *why*, not just *what*.

- **Configuration/data separated from logic**: all static content (stage copy, colors, dimensions, cluster definitions) lives in `config.ts`.

- **`.editorconfig`** is available for consistent indentation/line-endings across editors and contributors.

**Performance**

- **Pre-indexed data**:`dataByYear` is built once at load time, turning every year lookup into an O(1) `Map.get`.

- **Event listeners bound once**: hover/click/keyboard handlers are attached to the D3 `enter` selection only, not re-bound on every render.

- **Shared scales, computed once per render**: the angle scale, radius scale, and arc generator are computed once per year and passed down.

- **Cheaper tooltip updates**: `mousemove` only repositions the existing tooltip. Content is only rebuilt on `mouseenter`.

- **`prefers-reduced-motion` support**: respects the OS-level motion preference, which also reduces unnecessary animation work for users who've opted out of it.

**Accessibility (WCAG-oriented)**

- **Text alternative for the chart**: a visually-hidden, always-in-sync data table (`#a11yTable`) gives screen-reader users the same ranking/values a sighted user sees in the radial chart (WCAG 1.1.1 / 1.3.1).

- **Live region announcements**: a concise `aria-live="polite"` status announces year changes without forcing the whole table to be read out.

- **Keyboard interaction**: countries are focusable (`tabindex`, `role="button"`) and selectable via <kbd>Enter</kbd>/<kbd>Space</kbd>, not just mouse click.

- **Accessible names for controls**: toggle switches are linked to their visible label text via `aria-labelledby` and expose `role="switch"`/`aria-checked`. The play/pause button exposes `aria-pressed` and the legend toggle exposes `aria-expanded`.

- **Visible focus states**: `:focus-visible` outlines added for buttons, toggles, and country wedges.
- **`prefers-reduced-motion`** see above. This is also an accessibility feature (vestibular disorders, motion sensitivity).

- **SVG semantics**: `role="img"` with a `<title>`/`<desc>` pair describes the chart's purpose.

- **Consistent language**: `<html lang="fr">`. The UI copy is predominantly French, story navigation `aria-label`s translated for consistency.

**SEO**

- Descriptive `<title>` and `<meta name="description">`.

- Open Graph / Twitter card metadata.

- `application/ld+json` structured data (`WebApplication`).

- Favicon (inline SVG data URI, no extra file/request).

- `<noscript>` fallback message.

- `rel="preconnect"` to the D3 CDN.

**Maintainability & repo hygiene**

- `package.json` with `build`/`watch`/`serve`/`start` scripts and dev-only type dependencies (`typescript`, `@types/d3`).

- `tsconfig.json` in strict mode, configured to emit native browser ES modules (no bundler required).

- `.gitignore` (excludes `node_modules/` and the generated `dist/`) and `.editorconfig`.

## Accessibility

The radial chart is a rich visual encoding with no fully equivalent screen-reader experience on its own. Rather than attempt to make every hover/animation detail accessible, this refactor focuses on **equivalent access to the underlying information**:

- A hidden data table (reachable via a screen reader's table-navigation commands) lists every visible country, its rank, its happiness index, and its subjective index for the currently displayed year.
- A short live-region announcement fires on year change.
- Every country wedge is keyboard-focusable and selectable.
- All interactive controls (buttons, toggles) have accessible names and appropriate ARIA roles/states.

This is a solid baseline, not a claim of full WCAG AA conformance, see [Known limitations](#known-limitations--future-improvements).

## Browser support

Targets evergreen browsers (Chrome, Firefox, Safari, Edge — last 2 versions) via native ES modules, CSS custom properties, and `backdrop-filter`. No transpilation or polyfills are included; if you need to support older browsers, introduce a build step (e.g. esbuild/Vite) and a CSS fallback for `backdrop-filter`.

</details>

## Known limitations & future improvements

- **D3 via CDN, not a bundled package.** This keeps the app dependency-free at runtime (TypeScript/`@types/d3` are dev-only, used purely for compiling and type-checking) but also means the app is offline-unfriendly and pinned to whatever `d3.v7.min.js` currently resolves to.

- A few type positions (the arc generator's zero-argument call, in particular) needed a small `as unknown as DefaultArcObject` cast to bridge d3's datum-oriented typings with this app's constant-setter usage pattern. This is documented inline in `chart/arcs.ts`.

- **`noUncheckedIndexedAccess` is intentionally off.** The ten secondary CSV columns are accessed dynamically via `row[key]`. Turning this stricter flag on would require non-null assertions or guards at every such access for limited real-world benefit here. *Worth reconsidering* if the dynamic-column pattern is refactored into named properties.

- **`backdrop-filter` is used on several stacked panels** which is a known performance cost (GPU compositing) on some lower-end devices. Preserved as-is since it's core to the visual design. Worth profiling if targeting low-end hardware.

- **Full keyboard/screen-reader parity for the radial chart itself** (as opposed to the equivalent data table) would require a much larger accessibility investment (custom roving-tabindex grid, sonification, etc.) and is out of scope here.

- **No i18n system.** All copy is hardcoded French. Internationalizing would mean extracting strings into a translation layer.

## Contributing

See [contributing](CONTRIBUTING.md) file:

1. Fork/clone the repo.
2. `npm install` (installs `typescript` + `@types/d3`, dev-only).
3. `npm run watch` to recompile automatically as you edit, and `npm run serve` (in another terminal) to preview.
4. Make your change in the relevant module under `src/` (see [project structure](#project-structure)).
    - Most changes touch exactly one file.
    - Never edit `dist/` directly.
5. `npm run build` and confirm `tsc` reports zero errors before committing.
6. If you touch `src/chart/arcs.ts` or `src/story.ts`, manually re-check: stage navigation, year scrubbing/auto-play, country selection, cluster mode, perception mode. They can break easily.

## License

[CC0 1.0 Universal](LICENSE). Inspire yourself.

Ꙭ
