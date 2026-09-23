---
paths:
  - "src/**"
  - "index.html"
---

# three.js r74 constraints

The demo is pinned to the vendored **three.js r74** (2016) in
`vendor/three.min.js`, loaded as the global `THREE`. Modern three.js
documentation and examples mostly **do not apply**.

- Use the r74 API: `THREE.JSONLoader` (legacy geometry JSON),
  `new THREE.CubeCamera(near, far, size)` + `cubeCamera.updateCubeMap(renderer, scene)`,
  `cubeCamera.renderTarget` passed directly as a `samplerCube` uniform,
  `THREE.Math.*` (not `MathUtils`), uniforms declared with `{ type, value }`,
  GLSL 1 (`textureCube`, `gl_FragColor`).
- Do not import three.js from npm or a CDN, and do not mix revisions. An
  upgrade is a separate issue: it means converting the models (JSONLoader
  was removed in r99) and porting the cube-camera code.
- `THREE` and `dat` are globals. Modules read them with
  `const { THREE } = window;`.
- **Never edit `vendor/`.**

## Render-pass invariants (`src/diamond.js`, `src/main.js`)

The effect depends on the order of the passes and on visibility. When
changing either, keep these true:

1. The reflect cube map is rendered with **both** diamond meshes hidden.
2. The refract cube map is rendered with the inner stone visible (when
   *Inner refraction* is on) and the outer one hidden.
3. A mesh is never visible in a pass that renders into a cube map its own
   material samples. That is a GL feedback loop: black faces and a
   `GL_INVALID_OPERATION` warning.
4. The chrome ball's cube map is rendered after the diamond's, with the
   ball hidden.
5. The inner stone sits on the camera→diamond ray:
   `inner = outer + innerOffset * (outer - camera)`.

## Code style

- ES modules, 4-space indent, single quotes; constants in `src/config.js`,
  GUI-tweakable state in `createParams()`.
- The render loop must not allocate per frame: reuse vectors and write into
  uniform values in place.
- Asset paths are **relative** (`assets/...`). An absolute github.io URL
  breaks local runs and forks (cross-origin textures).
- Explain the optics in comments where a formula is not self-evident.
