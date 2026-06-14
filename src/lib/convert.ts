import { transferJpegExif } from "./exif";
import { type SourceInfo, type TargetFormat, targetInfo } from "./formats";

export interface ConvertSettings {
  target: TargetFormat;
  /** 0-100; only used for lossy targets. */
  quality: number;
  stripMetadata: boolean;
}

export interface ConvertOutput {
  blob: Blob;
  width: number;
  height: number;
}

function isJpegFile(file: File): boolean {
  return file.type === "image/jpeg" || /\.(jpe?g|jfif)$/i.test(file.name);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

async function decodeHeic(file: File): Promise<ImageBitmap> {
  // ~3MB wasm, only pulled in when a HEIC/HEIF file is actually converted.
  const { heicTo } = await import("heic-to/next");
  return heicTo({ blob: file, type: "bitmap" });
}

async function decodeTiff(file: File): Promise<ImageBitmap> {
  const UTIF = (await import("utif")).default;
  const buffer = new Uint8Array(await file.arrayBuffer());
  const ifds = UTIF.decode(buffer);
  if (ifds.length === 0) throw new Error("No image found in this TIFF.");
  const page = ifds[0];
  UTIF.decodeImage(buffer, page);
  const rgba = UTIF.toRGBA8(page);
  if (!page.width || !page.height) throw new Error("Invalid TIFF dimensions.");
  const data = new ImageData(
    new Uint8ClampedArray(rgba),
    page.width,
    page.height,
  );
  return createImageBitmap(data);
}

async function decodeToBitmap(
  file: File,
  source: SourceInfo,
  keepOrientationTag: boolean,
): Promise<ImageBitmap> {
  if (source.route === "heic") return decodeHeic(file);
  if (source.route === "tiff") return decodeTiff(file);
  // Bake EXIF orientation into pixels unless we're keeping the original Exif
  // (where the orientation tag stays authoritative and must not double-apply).
  return createImageBitmap(file, {
    imageOrientation: keepOrientationTag ? "none" : "from-image",
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(
              new Error("Couldn't encode the image. It may be too large."),
            ),
      mime,
      quality,
    );
  });
}

export async function convertImage(
  file: File,
  source: SourceInfo,
  settings: ConvertSettings,
): Promise<ConvertOutput> {
  const target = targetInfo(settings.target);
  const keepExif =
    !settings.stripMetadata && target.id === "jpeg" && isJpegFile(file);

  let bitmap: ImageBitmap;
  try {
    bitmap = await decodeToBitmap(file, source, keepExif);
  } catch (err) {
    // Detection can be wrong (e.g. a HEIC with no extension or MIME type).
    if (source.route === "native") {
      bitmap = await decodeHeic(file).catch(() => {
        throw err instanceof Error
          ? err
          : new Error("Couldn't decode this image.");
      });
    } else {
      throw err instanceof Error
        ? err
        : new Error("Couldn't decode this image.");
    }
  }

  const { width, height } = bitmap;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas isn't available in this browser.");
  }

  // JPEG has no alpha channel, so flatten any transparency onto white.
  if (target.id === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const quality = target.lossy ? clamp01(settings.quality / 100) : undefined;
  let blob = await canvasToBlob(canvas, target.mime, quality);

  if (keepExif) {
    blob = await transferJpegExif(file, blob);
  }

  return { blob, width, height };
}
