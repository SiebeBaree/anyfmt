export type TargetFormat = "png" | "jpeg" | "webp";

export interface TargetInfo {
  id: TargetFormat;
  label: string;
  mime: string;
  ext: string;
  /** Whether the quality setting applies. */
  lossy: boolean;
}

export const TARGETS: TargetInfo[] = [
  { id: "png", label: "PNG", mime: "image/png", ext: "png", lossy: false },
  { id: "jpeg", label: "JPEG", mime: "image/jpeg", ext: "jpg", lossy: true },
  { id: "webp", label: "WebP", mime: "image/webp", ext: "webp", lossy: true },
];

export function targetInfo(id: TargetFormat): TargetInfo {
  return TARGETS.find((t) => t.id === id) ?? TARGETS[0];
}

/** Decode path for a source file. */
export type SourceRoute = "native" | "heic" | "tiff";

export interface SourceInfo {
  route: SourceRoute;
  /** Short uppercase label for the UI, e.g. "HEIC", "PNG". */
  label: string;
}

const EXT_LABELS: Record<string, string> = {
  jpg: "JPEG",
  jpeg: "JPEG",
  jpe: "JPEG",
  jfif: "JPEG",
  png: "PNG",
  webp: "WebP",
  gif: "GIF",
  bmp: "BMP",
  avif: "AVIF",
  svg: "SVG",
  ico: "ICO",
  heic: "HEIC",
  heif: "HEIF",
  tif: "TIFF",
  tiff: "TIFF",
};

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/**
 * Cheap, synchronous classification used for routing and preview decisions.
 * The converter retries with other decoders at runtime if this guess is wrong,
 * so it only needs to be right most of the time.
 */
export function detectSource(file: File): SourceInfo {
  const ext = extOf(file.name);
  const mime = file.type.toLowerCase();

  if (
    mime === "image/heic" ||
    mime === "image/heif" ||
    ext === "heic" ||
    ext === "heif"
  ) {
    return { route: "heic", label: EXT_LABELS[ext] ?? "HEIC" };
  }
  if (mime === "image/tiff" || ext === "tif" || ext === "tiff") {
    return { route: "tiff", label: "TIFF" };
  }

  const label =
    EXT_LABELS[ext] ??
    (mime.startsWith("image/")
      ? mime.slice(6).toUpperCase()
      : ext.toUpperCase() || "IMG");
  return { route: "native", label };
}

/** Whether the browser can render this file directly in an <img> (for previews). */
export function canPreviewNatively(info: SourceInfo): boolean {
  return info.route === "native";
}

const IMAGE_EXTS = new Set(Object.keys(EXT_LABELS));

export function looksLikeImage(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_EXTS.has(extOf(file.name));
}
