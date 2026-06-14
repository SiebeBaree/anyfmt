"use client";

import { type TargetFormat, targetInfo } from "@/lib/formats";
import type { ConvertItem } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import {
  IconArrowRight,
  IconCheck,
  IconClose,
  IconDownload,
  IconSpinner,
} from "./icons";
import { Button } from "./ui";

function SavingBadge({ from, to }: { from: number; to: number }) {
  if (!from || !to) return null;
  const pct = Math.round((1 - to / from) * 100);
  if (pct >= 1) {
    return (
      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
        −{pct}%
      </span>
    );
  }
  if (pct <= -1) {
    return (
      <span className="rounded-full bg-zinc-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted">
        +{Math.abs(pct)}%
      </span>
    );
  }
  return null;
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
    <li className="flex items-center gap-3 px-4 py-2.5">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
        {item.previewUrl ? (
          // Local object URL of an already-decoded image; next/image adds no value here.
          // biome-ignore lint/performance/noImgElement: blob preview, not a remote asset
          <img
            src={item.previewUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-[10px] font-medium text-muted">
            {item.source.label}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{item.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted">
          <span className="font-mono uppercase">{item.source.label}</span>
          <IconArrowRight className="h-3 w-3" />
          <span className="font-mono uppercase">{tgt.label}</span>
          <span className="text-line">·</span>
          {result ? (
            <>
              <span className="font-mono">
                {formatBytes(item.size)}{" "}
                <span className="text-muted/60">→</span>{" "}
                <span className="text-fg">{formatBytes(result.size)}</span>
              </span>
              <SavingBadge from={item.size} to={result.size} />
            </>
          ) : (
            <span className="font-mono">{formatBytes(item.size)}</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {item.status === "converting" && (
          <IconSpinner className="h-4 w-4 animate-spin text-accent" />
        )}
        {item.status === "done" && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconCheck className="h-3 w-3" />
          </span>
        )}
        {item.status === "error" && (
          <span
            className="max-w-[150px] truncate text-xs text-red-500"
            title={item.error}
          >
            {item.error ?? "Failed"}
          </span>
        )}
        {result && (
          <Button variant="icon" onClick={onDownload} aria-label="Download">
            <IconDownload className="h-4 w-4" />
          </Button>
        )}
        <Button variant="icon" onClick={onRemove} aria-label="Remove">
          <IconClose className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
