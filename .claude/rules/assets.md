---
paths:
  - "assets/**"
---

# Assets

- `assets/models/brilliant-outer.json` and `brilliant-inner.json` are the
  two meshes in use: the visible outer shell and the inner stone that is
  rendered only into the refraction cube map. Both are **three.js legacy
  JSON geometry** (format 3), the only format r74's `JSONLoader` reads.
- `assets/models/experiments/` holds earlier cuts and normal variants
  (`sn` = smooth normals, `fn`/`fnm*` = flat normals and variants). They
  are kept for reference and are not loaded. Do not delete them without
  an issue.
- `assets/textures/study-room-equirect.jpg` is a 3000×1500 equirectangular
  panorama. r74 resizes it to 4096×2048 because it is not a power of two;
  the console warning about this is expected.
- Keep the file names kebab-case. A rename must update `src/config.js` in
  the same commit; `npm run check:assets` catches misses.
- Mind file size: everything here is downloaded on page load.
