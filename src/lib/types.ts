import type { SourceInfo } from "./formats";

export type ItemStatus = "pending" | "converting" | "done" | "error";

export interface ConvertResultMeta {
  blob: Blob;
  size: number;
  width: number;
  height: number;
}

export interface ConvertItem {
  id: string;
  file: File;
  name: string;
  size: number;
  source: SourceInfo;
  status: ItemStatus;
  /** Object URL for an in-browser-previewable original (revoked on removal). */
  previewUrl?: string;
  result?: ConvertResultMeta;
  error?: string;
}
