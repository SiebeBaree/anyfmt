/**
 * Best-effort EXIF (APP1) metadata transfer between JPEG byte streams.
 *
 * Canvas re-encoding always drops metadata, so when the user chooses to KEEP
 * metadata and both source and target are JPEG, we copy the original Exif
 * segment into the freshly encoded output. Anything unexpected falls back to
 * the original output, so the produced image is always valid.
 */

const SOI = 0xd8;
const APP0 = 0xe0;
const APP1 = 0xe1;
const SOS = 0xda;
const EOI = 0xd9;

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === SOI;
}

/** Extract the full APP1/Exif segment (marker + length + payload) from a JPEG. */
export function extractExifSegment(bytes: Uint8Array): Uint8Array | null {
  if (!isJpeg(bytes)) return null;
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null; // not a clean marker boundary
    const marker = bytes[offset + 1];
    if (marker === SOS || marker === EOI) return null; // reached image data
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2) return null;
    const segmentEnd = offset + 2 + length;
    if (segmentEnd > bytes.length) return null;
    const isExif =
      marker === APP1 &&
      bytes[offset + 4] === 0x45 && // "E"
      bytes[offset + 5] === 0x78 && // "x"
      bytes[offset + 6] === 0x69 && // "i"
      bytes[offset + 7] === 0x66 && // "f"
      bytes[offset + 8] === 0x00 &&
      bytes[offset + 9] === 0x00;
    if (isExif) return bytes.slice(offset, segmentEnd);
    offset = segmentEnd;
  }
  return null;
}

/** Insert an APP1/Exif segment into a JPEG, after the APP0/JFIF segment if present. */
function insertExifSegment(
  jpeg: Uint8Array,
  exif: Uint8Array,
): Uint8Array<ArrayBuffer> {
  let insertAt = 2; // immediately after SOI
  if (jpeg[2] === 0xff && jpeg[3] === APP0) {
    const app0Length = (jpeg[4] << 8) | jpeg[5];
    insertAt = 4 + app0Length;
  }
  const out = new Uint8Array(jpeg.length + exif.length);
  out.set(jpeg.subarray(0, insertAt), 0);
  out.set(exif, insertAt);
  out.set(jpeg.subarray(insertAt), insertAt + exif.length);
  return out;
}

/**
 * Returns a new JPEG blob carrying the source's Exif metadata, or the original
 * `output` blob unchanged if the transfer isn't possible.
 */
export async function transferJpegExif(
  source: Blob,
  output: Blob,
): Promise<Blob> {
  try {
    const [srcBytes, outBytes] = await Promise.all([
      source.arrayBuffer().then((b) => new Uint8Array(b)),
      output.arrayBuffer().then((b) => new Uint8Array(b)),
    ]);
    const exif = extractExifSegment(srcBytes);
    if (!exif || !isJpeg(outBytes)) return output;
    return new Blob([insertExifSegment(outBytes, exif)], {
      type: "image/jpeg",
    });
  } catch {
    return output;
  }
}
