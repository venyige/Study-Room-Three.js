# Study-Room-Three.js

A static three.js (r74) demo: a diamond faked with a two-pass cube-map
**double refraction**, shown inside a panorama of a study room next to a chrome
ball. Published on GitHub Pages. No build step, no framework.

Detailed rules live in `.claude/rules/` and are loaded automatically:

| Rule | Covers |
|---|---|
| `git-workflow.md` | issue → branch → pull request; `master` is never committed to directly |
| `verification.md` | what to run before pushing (mirrors CI) |
| `threejs-r74.md` | API constraints of the vendored three.js, the render-pass invariants (scoped to `src/`) |
| `assets.md` | model and texture conventions (scoped to `assets/`) |

## Layout

- `index.html` — loads `vendor/` scripts as globals, then `src/main.js` as an ES module
- `src/` — the demo; `src/diamond.js` is the trick, read its header comment first
- `vendor/` — third-party minified builds (three.js r74, dat.gui). **Never edit.**
- `assets/` — models (three.js legacy JSON) and textures
- `tests/` — asset check and Playwright smoke test
- `.github/` — CI, Pages deploy, Dependabot, issue/PR templates

## Language

Code, comments, commits, issues and PRs are in English (public repository).
