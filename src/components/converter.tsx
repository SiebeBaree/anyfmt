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
import {
  IconDownload,
  IconImage,
  IconShield,
  IconSliders,
  IconSpinner,
  IconUpload,
} from "./icons";
import { Button, Segmented, Slider, Toggle } from "./ui";

const MAX_FILES = 20;
const CONCURRENCY = 3;

/** True when a drag carries actual files (not text or in-page elements). */
function dragHasFiles(e: DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes("Files");
}

/** True when the paste happened inside a text input, where it should be left alone. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

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
  const [pageDragging, setPageDragging] = useState(false);

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

  // Latest addFiles for the window-level listeners below, which mount once.
  const addFilesRef = useRef(addFiles);
  useEffect(() => {
    addFilesRef.current = addFiles;
  });

  // Feature: drop images anywhere on the page. A depth counter pairs
  // dragenter/dragleave (they fire per crossed element) so the overlay only
  // hides when the drag truly leaves the window.
  useEffect(() => {
    let depth = 0;

    function onDragEnter(e: DragEvent) {
      if (!dragHasFiles(e)) return;
      e.preventDefault();
      depth++;
      setPageDragging(true);
    }
    function onDragOver(e: DragEvent) {
      if (!dragHasFiles(e)) return;
      // Required to allow the drop and suppress the browser's default
      // open-the-file navigation.
      e.preventDefault();
    }
    function onDragLeave(e: DragEvent) {
      if (!dragHasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setPageDragging(false);
    }
    function onDrop(e: DragEvent) {
      if (!dragHasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setPageDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) addFilesRef.current(files);
    }

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  // Feature: paste an image from the clipboard. Clipboard files arrive with a
  // generic name ("image.png"), so give them a friendlier, unique one.
  const pasteCounter = useRef(0);
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (isEditableTarget(e.target)) return;
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (files.length === 0) return;
      e.preventDefault();
      const renamed = files.map((file) => {
        const ext = file.type.split("/")[1]?.split("+")[0] || "png";
        pasteCounter.current++;
        const name =
          pasteCounter.current === 1
            ? `pasted-image.${ext}`
            : `pasted-image-${pasteCounter.current}.${ext}`;
        return new File([file], name, { type: file.type });
      });
      addFilesRef.current(renamed);
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

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
      {/* Page header, Notion style: icon, title, description, callout. */}
      <div aria-hidden className="select-none text-[56px] leading-none">
        🖼️
      </div>
      <h1 className="mt-5 text-[40px] font-bold leading-[1.15] tracking-[-0.015em] text-fg">
        anyfmt
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Convert images between formats, right here in your browser.
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-md bg-callout px-4 py-3.5">
        <span aria-hidden className="text-base leading-6">
          🔒
        </span>
        <p className="text-sm leading-6 text-fg">
          Everything runs on your device. Images are converted locally and never
          uploaded anywhere.
        </p>
      </div>

      <div className="my-8 h-px w-full bg-line" />

      {total === 0 ? (
        <>
          <Dropzone onFiles={addFiles} />
          {notice && <p className="mt-3 text-sm text-muted">{notice}</p>}
          <p className="mt-4 text-xs text-faint">
            PNG · JPEG · WebP · HEIC · TIFF · GIF · BMP · AVIF
          </p>
        </>
      ) : (
        <>
          {/* Settings as Notion property rows. */}
          <div
            className={cn(
              "flex flex-col gap-1 transition-opacity",
              isConverting && "pointer-events-none opacity-60",
            )}
          >
            <div className="flex min-h-[34px] flex-wrap items-center gap-x-2 gap-y-1">
              <div className="flex w-[150px] shrink-0 items-center gap-2 text-sm text-muted">
                <IconImage className="h-4 w-4" />
                Format
              </div>
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

            <div className="flex min-h-[34px] flex-wrap items-center gap-x-2 gap-y-1">
              <div className="flex w-[150px] shrink-0 items-center gap-2 text-sm text-muted">
                <IconSliders className="h-4 w-4" />
                Quality
              </div>
              {tgt.lossy ? (
                <div className="flex max-w-[300px] flex-1 items-center gap-3">
                  <Slider
                    min={1}
                    max={100}
                    value={quality}
                    onChange={handleQualityChange}
                  />
                  <span className="w-10 shrink-0 text-right text-sm tabular-nums text-fg">
                    {quality}%
                  </span>
                </div>
              ) : (
                <span className="text-sm text-faint">
                  Lossless · always full quality
                </span>
              )}
            </div>

            <div className="flex min-h-[34px] flex-wrap items-center gap-x-2 gap-y-1">
              <div className="flex w-[150px] shrink-0 items-center gap-2 text-sm text-muted">
                <IconShield className="h-4 w-4" />
                Remove metadata
              </div>
              <Toggle
                checked={stripMetadata}
                onChange={handleStripChange}
                label="Remove metadata"
              />
            </div>
          </div>

          {/* File list as a Notion database list view. */}
          <div className="mt-5 overflow-hidden rounded-md border border-line bg-surface">
            {isConverting && (
              <div className="h-[2px] w-full bg-line">
                <div
                  className="h-full bg-accent transition-[width] duration-300"
                  style={{
                    width: `${total > 0 ? Math.round((processed / total) * 100) : 0}%`,
                  }}
                />
              </div>
            )}
            <ul className="max-h-[min(55vh,480px)] divide-y divide-line overflow-y-auto">
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
            <div className="border-t border-line">
              <Dropzone
                variant="row"
                onFiles={addFiles}
                disabled={total >= MAX_FILES || isConverting}
              />
            </div>
          </div>

          {(notice || total >= MAX_FILES) && (
            <p className="mt-2 text-xs text-muted">
              {notice ?? `Maximum ${MAX_FILES} images reached`}
            </p>
          )}

          {/* Action bar. */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {allDone && doneItems.length > 0 ? (
                <>
                  {doneItems.length} ready
                  {saved > 0 && (
                    <>
                      {" · "}
                      <span className="text-[#448361] dark:text-[#529e72]">
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

      {/* Full-page drop overlay. pointer-events-none keeps drag events flowing
          to the window listeners underneath. */}
      {pageDragging && (
        <div className="pointer-events-none fixed inset-0 z-50 bg-background/60 p-6 backdrop-blur-[2px]">
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-accent bg-accent/5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-[0_4px_12px_rgba(35,131,226,0.4)]">
              <IconUpload className="h-6 w-6" />
            </span>
            <p className="text-lg font-semibold text-fg">
              Drop images to add them
            </p>
            <p className="text-sm text-muted">
              They will be converted right on this device
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
