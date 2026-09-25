# Verification before pushing

`npm test` runs exactly what the CI workflow (`.github/workflows/ci.yml`)
checks. Keep the two in step: a check added to one goes into the other in
the same pull request.

```bash
npm ci                              # first time
npx playwright install chromium     # first time, for the smoke test
npm test                            # lint + asset check + smoke test
```

- `npm run lint`: ESLint on `src/` and `tests/` (`vendor/` is excluded).
- `npm run check:assets`: every `assets/...` path quoted in `src/` exists,
  and every model parses as three.js legacy JSON.
- `npm run test:smoke`: headless Chromium with SwiftShader WebGL. Fails on
  any page error, console error, WebGL `GL_INVALID_*` warning (how a
  render-pass feedback loop shows up) or HTTP error, and writes
  `test-results/smoke.png`. **Look at the screenshot** after a rendering
  change: a clean console does not prove the diamond still refracts.

To view the demo: `npm start`, then http://localhost:8080. Opening
`index.html` from `file://` does not work (ES modules and textures need
HTTP).

Report what was run and what it printed. Say so when something was not
verified, e.g. touch gestures, which need a real device.
