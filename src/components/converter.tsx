"use client";

import { useEffect, useRef, useState } from "react";
import { convertImage } from "@/lib/convert";
import {
  canPreviewNatively,
  detectSource,
  looksLikeImage,
  TARGETS,
  type TargetFormat,
  targetInfo,
} from "@/lib/formats";
import type { ConvertItem } from "@/lib/types";
import { usePersistentState } from "@/lib/use-persistent-state";
import { baseName, cn, downloadBlob, formatBytes, uid } from "@/lib/utils";
import { createZip, type ZipEntry } from "@/lib/zip";
import { Dropzone } from "./dropzone";
import { FileItem } from "./file-item";
import { IconBolt, IconDownload, IconSpinner } from "./icons";
import { Button, Segmented, Slider, Toggle } from "./ui";

const MAX_FILES = 20;
const CONCURRENCY = 3;

export function Converter() {
  const [items, setItems] = useState<ConvertItem[]>([]);
  const [target, setTarget] = usePersistentState<TargetFormat>(
    "anyfmt:target",
    "png",
  );
  const [quality, setQuality] = usePersistentState<number>(
    "anyfmt:quality",
    100,
  );
  const [stripMetadata, setStripMetadata] = usePersistentState<boolean>(
    "anyfmt:strip-metadata",
    true,
  );
  const [isConverting, setIsConverting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Keep a live ref to the latest items so async work (conversion, zip export,
  // unmount cleanup) reads current state without re-binding. Updated post-commit.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  });

  // Revoke any preview object URLs when the component unmounts.
  useEffect(() => {
    return () => {
      for (const it of itemsRef.current) {
        if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      }
    };
  }, []);

  // Changing a setting invalidates already-finished results so they reconvert
  // with the new settings. Wired through the change handlers below (rather than
  // an effect) so restoring values from localStorage on load doesn't wipe them.
  function invalidateResults() {
    setItems((prev) =>
      prev.map((it) =>
        it.status === "done" || it.status === "error"
          ? { ...it, status: "pending", result: undefined, error: undefined }
          : it,
      ),
    );
  }

  function handleTargetChange(value: TargetFormat) {
    setTarget(value);
    invalidateResults();
  }

  function handleQualityChange(value: number) {
    setQuality(value);
    invalidateResults();
  }

  function handleStripChange(value: boolean) {
    setStripMetadata(value);
    invalidateResults();
  }

  const tgt = targetInfo(target);
  const total = items.length;
  const doneItems = items.filter((it) => it.status === "done");
  const pendingCount = items.filter((it) => it.status === "pending").length;
  const errorCount = items.filter((it) => it.status === "error").length;
  const processed = doneItems.length + errorCount;
  const allDone = total > 0 && pendingCount === 0 && !isConverting;
  const totalOriginal = doneItems.reduce((sum, it) => sum + it.size, 0);
  const totalConverted = doneItems.reduce(
    (sum, it) => sum + (it.result?.size ?? 0),
    0,
  );
  const saved = totalOriginal - totalConverted;

  function addFiles(files: File[]) {
    setNotice(null);
    const images = files.filter(looksLikeImage);
    const skippedNonImage = files.length - images.length;

    setItems((prev) => {
      const room = Math.max(0, MAX_FILES - prev.length);
      const accepted = images.slice(0, room);
      const overflow = images.length - accepted.length;

      const messages: string[] = [];
      if (skippedNonImage > 0) {
        messages.push(
          `${skippedNonImage} non-image file${skippedNonImage > 1 ? "s" : ""} skipped`,
        );
      }
      if (overflow > 0) {
        messages.push(`${overflow} over the ${MAX_FILES}-image limit skipped`);
      }
      if (messages.length) setNotice(messages.join(" · "));

      const next: ConvertItem[] = accepted.map((file) => {
        const source = detectSource(file);
        const previewUrl = canPreviewNatively(source)
          ? URL.createObjectURL(file)
          : undefined;
        return {
          id: uid(),
          file,
          name: file.name,
          size: file.size,
          source,
          status: "pending",
          previewUrl,
        };
      });
      return [...prev, ...next];
    });
  }

  function patchItem(id: string, patch: Partial<ConvertItem>) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const found = prev.find((it) => it.id === id);
      if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((it) => it.id !== id);
    });
  }

  function clearAll() {
    for (const it of itemsRef.current) {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
    }
    setItems([]);
    setNotice(null);
  }

  async function convertAll() {
    if (isConverting) return;
    const queue = itemsRef.current.filter((it) => it.status === "pending");
    if (queue.length === 0) return;

    setIsConverting(true);
    const settings = { target, quality, stripMetadata };

    async function worker() {
      for (;;) {
        const next = queue.shift();
        if (!next) return;
        patchItem(next.id, { status: "converting" });
        try {
          const out = await convertImage(next.file, next.source, settings);
          patchItem(next.id, {
            status: "done",
            error: undefined,
            result: {
              blob: out.blob,
              size: out.blob.size,
              width: out.width,
              height: out.height,
            },
          });
        } catch (err) {
          patchItem(next.id, {
            status: "error",
            error: err instanceof Error ? err.message : "Conversion failed",
          });
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker),
    );
    setIsConverting(false);
  }

  function outputName(it: ConvertItem) {
    return `${baseName(it.name)}.${tgt.ext}`;
  }

  function downloadOne(it: ConvertItem) {
    if (it.result) downloadBlob(it.result.blob, outputName(it));
  }

  async function downloadAll() {
    const finished = itemsRef.current.filter(
      (it) => it.status === "done" && it.result,
    );
    if (finished.length === 0) return;

    // A single image downloads directly, with no pointless zip wrapper.
    if (finished.length === 1) {
      downloadOne(finished[0]);
      return;
    }

    const used = new Set<string>();
    const entries: ZipEntry[] = [];
    for (const it of finished) {
      if (!it.result) continue;
      let name = outputName(it);
      if (used.has(name.toLowerCase())) {
        let n = 1;
        let candidate: string;
        do {
          candidate = `${baseName(name)} (${n}).${tgt.ext}`;
          n++;
        } while (used.has(candidate.toLowerCase()));
        name = candidate;
      }
      used.add(name.toLowerCase());
      const buffer = new Uint8Array(await it.result.blob.arrayBuffer());
      entries.push({ name, data: buffer });
    }
    downloadBlob(createZip(entries), `anyfmt-${entries.length}-images.zip`);
  }

  return (
    <div className="w-full">
      <header className="mb-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
            <IconBolt className="h-4 w-4" />
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-fg">
            anyfmt
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted">
          Convert images right in your browser. Nothing is uploaded.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        {total === 0 ? (
          <div className="p-4">
            <Dropzone onFiles={addFiles} />
            {notice && (
              <p className="mt-3 text-center text-xs text-muted">{notice}</p>
            )}
            <p className="mt-4 text-center font-mono text-xs text-muted/70">
              PNG · JPEG · WebP · HEIC · TIFF · GIF · BMP · AVIF
            </p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-line p-4 transition-opacity",
                isConverting && "pointer-events-none opacity-60",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-muted">Convert to</span>
                <Segmented
                  ariaLabel="Target format"
                  value={target}
                  onChange={handleTargetChange}
                  options={TARGETS.map((t) => ({
                    value: t.id,
                    label: t.label,
                  }))}
                />
              </div>

              {tgt.lossy && (
                <div className="flex min-w-[200px] flex-1 items-center gap-3">
                  <span className="text-sm text-muted">Quality</span>
                  <Slider
                    min={1}
                    max={100}
                    value={quality}
                    onChange={handleQualityChange}
                  />
                  <span className="w-9 shrink-0 text-right font-mono text-sm tabular-nums text-fg">
                    {quality}%
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <span className="text-sm text-muted">Remove metadata</span>
                <Toggle
                  checked={stripMetadata}
                  onChange={handleStripChange}
                  label="Remove metadata"
                />
              </div>
            </div>

            <ul className="max-h-[min(50vh,460px)] divide-y divide-line overflow-y-auto">
              {items.map((it) => (
                <FileItem
                  key={it.id}
                  item={it}
                  target={target}
                  onRemove={() => removeItem(it.id)}
                  onDownload={() => downloadOne(it)}
                />
              ))}
            </ul>

            <div className="border-t border-line p-3">
              <Dropzone
                compact
                onFiles={addFiles}
                disabled={total >= MAX_FILES || isConverting}
              />
              {(notice || total >= MAX_FILES) && (
                <p className="mt-2 text-center text-xs text-muted">
                  {notice ?? `Maximum ${MAX_FILES} images reached`}
                </p>
              )}
            </div>

            <div className="h-0.5 w-full bg-line">
              <div
                className="h-full bg-accent transition-[width] duration-300"
                style={{
                  width: `${total > 0 ? Math.round((processed / total) * 100) : 0}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 p-4">
              <p className="text-sm text-muted">
                {allDone && doneItems.length > 0 ? (
                  <>
                    {doneItems.length} ready
                    {saved > 0 && (
                      <>
                        {" · "}
                        <span className="text-emerald-600 dark:text-emerald-400">
                          saved {formatBytes(saved)}
                        </span>
                      </>
                    )}
                    {errorCount > 0 && ` · ${errorCount} failed`}
                  </>
                ) : (
                  <>
                    {total} image{total > 1 ? "s" : ""}
                    {errorCount > 0 && ` · ${errorCount} failed`}
                  </>
                )}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={clearAll}
                  disabled={isConverting}
                >
                  Clear
                </Button>
                {doneItems.length > 0 && (
                  <Button
                    variant={pendingCount > 0 ? "secondary" : "primary"}
                    onClick={downloadAll}
                    disabled={isConverting}
                  >
                    <IconDownload className="h-4 w-4" />
                    {doneItems.length > 1 ? "Download all" : "Download"}
                  </Button>
                )}
                {(pendingCount > 0 || isConverting) && (
                  <Button
                    onClick={convertAll}
                    disabled={isConverting || pendingCount === 0}
                  >
                    {isConverting ? (
                      <>
                        <IconSpinner className="h-4 w-4 animate-spin" />
                        Converting {processed}/{total}
                      </>
                    ) : (
                      <>
                        Convert {pendingCount} image
                        {pendingCount > 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted/70">
        Your images never leave this device.
      </p>
    </div>
  );
}
