# anyfmt

A fast, private image format converter. Everything runs **in your browser**, so
images are never uploaded to a server. No accounts, no limits, nothing to leak.

## What it does

- Convert up to **20 images at once** to **PNG**, **JPEG**, or **WebP**.
- Accepts a wide range of inputs: PNG, JPEG, WebP, GIF, BMP, AVIF, plus
  **HEIC/HEIF** (iPhone photos) and **TIFF** via lazily-loaded WebAssembly.
- One target format for the whole batch; pick it once.
- **Remove metadata** (EXIF/GPS), on by default. When off, EXIF is preserved
  for JPEG to JPEG conversions.
- **Quality** control for lossy targets (JPEG/WebP).
- Both settings are remembered between visits via `localStorage`.
- Download each result individually, or all at once (a single image downloads
  directly; multiple images come as a `.zip`).

## How it works

| Step | Where | How |
| --- | --- | --- |
| Decode common formats | Browser | `createImageBitmap` (EXIF orientation baked in) |
| Decode HEIC/HEIF, TIFF | Browser | `heic-to` (libheif WASM) and `utif`, imported only when needed |
| Encode PNG/JPEG/WebP | Browser | `<canvas>.toBlob` |
| Zip "download all" | Browser | tiny built-in store-method ZIP writer (no dependency) |

There is **no backend**. No API routes, no uploads, no rate limiting needed.
The HEIC decoder (~3 MB of WASM) is code-split and fetched only the first time
you convert a HEIC or TIFF file.

## Development

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build
pnpm lint     # Biome
```

Built with Next.js 16 (App Router), React 19, and Tailwind CSS v4.
