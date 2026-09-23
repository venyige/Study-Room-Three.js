# Study-Room-Three.js

**[▶ Live demo](https://venyige.github.io/Study-Room-Three.js/)**

A three.js study of a trick I came up with: a diamond that **refracts twice**,
built from cube maps alone. It sits in a panorama of my study room, next to a
worn chrome ball that shows the reflected side of things.
([Fanfares!](https://freesound.org/embed/sound/iframe/350428/simple/large/))

## The trick

A real diamond sparkles because light is bent twice: once going into the stone,
and again coming out through the back facets. The usual cube-map refraction
shader models only the first bend, so the stone looks like a lump of glass.

This demo fakes the second bend with a second, hidden stone:

```
          camera
            │
            ▼
   ┌──── outer stone ────┐   visible; reflects map A, refracts map B
   │        │            │
   │        ▼            │
   │   inner stone       │   never drawn on screen; placed behind the outer one
   │  (on the view ray)  │   on the camera ray; refracts map A
   └─────────────────────┘

   map A = cube map of the room, no diamond          (reflect camera)
   map B = cube map of the room + the inner stone    (refract camera)
```

Each frame:

1. **Map A**: render the environment with both stones hidden.
2. **Map B**: render the environment with only the inner stone visible. The
   inner stone refracts map A using the *exit* ratio (> 1, light leaving the
   dense medium).
3. **Main pass**: the outer stone refracts map B using the *entry* ratio (< 1).
   What you see through it has already been bent once by the inner stone.

On top of that the shader does **dispersion**: red, green and blue use slightly
different refraction ratios, so the colours fan out at the facet edges. It also
applies a per-channel **hue / glow** tint. The inner stone sits on the line from
the camera through the diamond, at a distance set by *Inner refr. magn.*

The core is [src/diamond.js](src/diamond.js) and
[src/shaders/fresnel.js](src/shaders/fresnel.js). The shader started from the
Fresnel shader in the three.js examples.

## Controls

| Input | Action |
|---|---|
| Drag the background | Orbit the camera |
| Drag the diamond or the ball | Move it |
| Mouse wheel / pinch | Zoom (field of view) |

| Panel | What it does |
|---|---|
| **Entry refraction** | Refraction ratio at the outer surface (0.70–1.00) |
| **Exit refraction** | Refraction ratio of the inner stone (1.00–1.40) |
| **Dispersion** | How far green and blue drift from red (0 = none) |
| **Inner refr. magn.** | Distance of the inner stone behind the outer one |
| **Inner refraction** | Turn the second bend off to compare with plain refraction |
| **Diamond hue / glow / Hue to glow** | Tint of the refracted light |
| **Rotate …** | Toggle the camera, ball and diamond animation |
| **Show inner stone only** | Debug view: show the hidden inner stone instead |

## Running locally

The site is static, with no build step. It needs an HTTP server because ES
modules and textures do not load from `file://`.

```bash
npm ci
npm start               # http://localhost:8080
```

Any static server works as well, e.g. `python3 -m http.server`.

## Project layout

```
index.html              page shell; loads vendor globals, then src/main.js
src/
  main.js               scene setup and render loop (pass order lives here)
  config.js             asset paths, constants, GUI defaults
  diamond.js            the double-refraction rig
  shaders/fresnel.js    dispersive Fresnel shader and its uniform helpers
  environment.js        room panorama and chrome ball
  interaction.js        orbit / drag / zoom (pointer events)
  gui.js                dat.GUI panel
css/                    page and dat.GUI theme
vendor/                 three.js r74, dat.gui (third-party, unmodified)
assets/
  models/               brilliant-outer.json, brilliant-inner.json
  models/experiments/   earlier cuts and normal variants, not loaded
  textures/             study room panorama, worn metal
tests/                  asset check and headless browser smoke test
.github/                CI, Pages deploy, Dependabot, issue/PR templates
.claude/                rules and hooks for Claude Code
```

## Checks

```bash
npx playwright install chromium   # once
npm test                          # lint + asset check + smoke test
```

The smoke test opens the page in headless Chromium (software WebGL). It fails
on any JavaScript error, console error or missing file, and saves
`test-results/smoke.png`.

## GitHub setup

| Feature | File | Status |
|---|---|---|
| **CI**: lint, asset check, smoke test on every PR and push to `master` | `.github/workflows/ci.yml` | active once merged |
| **Pages deploy** after CI passes on `master` | same workflow, `deploy` job | needs *Settings → Pages → Source: GitHub Actions* |
| **Dependabot** monthly updates for Actions and npm dev tools | `.github/dependabot.yml` | active once merged |
| **Issue / PR templates** | `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md` | active once merged |

Recommended repository settings:

- **Branch protection on `master`**: require a pull request and the `Lint &
  assets` and `Browser smoke test` checks before merging.
- **Squash merge only**, and delete branches automatically after merge.
- **Pages from Actions**, so only the site files are published and a broken
  commit never goes live.

Workflow: open an issue, branch as `ISSUE__short_slug` (e.g. `7__zoom_limits`),
tag commits with `(#7)`, and open a pull request with `Closes #7`.

## Ideas / known limits

- three.js is pinned at **r74** (2016). Upgrading needs the models converted
  to glTF (`JSONLoader` was removed in r99) and the cube-camera code ported.
  `WebGLCubeRenderTarget` and PMREM would make the maps cheaper.
- Two 2048² cube maps are re-rendered every frame (12 extra scene renders),
  which is heavy on mobile GPUs. A resolution option or rendering only on
  change would help.
- Animation speeds are per frame, so they depend on the display refresh rate.
