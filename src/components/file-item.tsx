"use client";

import { type TargetFormat, targetInfo } from "@/lib/formats";
import type { ConvertItem } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { IconCheck, IconClose, IconDownload, IconSpinner } from "./icons";
import { Button, Tag } from "./ui";

function savingsLabel(from: number, to: number): string | null {
  if (!from || !to) return null;
  const pct = Math.round((1 - to / from) * 100);
  if (pct >= 1) return `−${pct}%`;
  if (pct <= -1) return `+${Math.abs(pct)}%`;
  return null;
}

function StatusTag({ item }: { item: ConvertItem }) {
  switch (item.status) {
    case "pending":
      return <Tag color="gray">Ready</Tag>;
    case "converting":
      return (
        <Tag color="blue">
          <IconSpinner className="h-3 w-3 animate-spin" />
          Converting
        </Tag>
      );
    case "done": {
      const saved = item.result
        ? savingsLabel(item.size, item.result.size)
        : null;
      return (
        <Tag color="green">
          <IconCheck className="h-3 w-3" />
          Done
          {saved && <span className="hidden sm:inline">{` · ${saved}`}</span>}
        </Tag>
      );
    }
    case "error":
      return (
        <Tag color="red" title={item.error}>
          {item.error ?? "Failed"}
        </Tag>
      );
  }
}

export function FileItem({
  item,
  target,
  onRemove,
  onDownload,
}: {
  item: ConvertItem;
  target: TargetFormat;
  onRemove: () => void;
  onDownload: () => void;
}) {
  const tgt = targetInfo(target);
  const result = item.status === "done" ? item.result : undefined;

  return (
    <li className="group flex items-center gap-3 px-3 py-2 transition-colors duration-100 hover:bg-wash">
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-[4px] shadow-[0_0_0_1px_var(--line)]">
        {item.previewUrl ? (
          // Local object URL of an already-decoded image; next/image adds no value here.
          // biome-ignore lint/performance/noImgElement: blob preview, not a remote asset
          <img
            src={item.previewUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-2 font-mono text-[9px] font-medium text-muted">
            {item.source.label}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{item.name}</p>
        <p className="mt-px truncate text-xs text-muted">
          {item.source.label} → {tgt.label}
          <span className="text-faint"> · </span>
          {result ? (
            <span className="tabular-nums">
              {formatBytes(item.size)} → {formatBytes(result.size)}
            </span>
          ) : (
            <span className="tabular-nums">{formatBytes(item.size)}</span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <StatusTag item={item} />
        {/* Hover-revealed on pointer devices, always visible on touch. */}
        <div className="flex items-center opacity-0 transition-opacity duration-100 focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
          {result && (
            <Button variant="icon" onClick={onDownload} aria-label="Download">
              <IconDownload className="h-4 w-4" />
            </Button>
          )}
          <Button variant="icon" onClick={onRemove} aria-label="Remove">
            <IconClose className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}
