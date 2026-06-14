declare module "utif" {
  export interface UtifIFD {
    width: number;
    height: number;
    [tag: string]: unknown;
  }

  export function decode(buffer: ArrayBuffer | Uint8Array): UtifIFD[];
  export function decodeImage(
    buffer: ArrayBuffer | Uint8Array,
    ifd: UtifIFD,
    ifds?: UtifIFD[],
  ): void;
  export function toRGBA8(ifd: UtifIFD): Uint8Array;

  const UTIF: {
    decode: typeof decode;
    decodeImage: typeof decodeImage;
    toRGBA8: typeof toRGBA8;
  };
  export default UTIF;
}
