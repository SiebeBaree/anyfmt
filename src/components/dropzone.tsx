"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { IconUpload } from "./icons";

export function Dropzone({
  onFiles,
  compact = false,
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function emit(list: FileList | null) {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.heic,.heif,.tif,.tiff,.avif"
        className="hidden"
        onChange={(e) => {
          emit(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) emit(e.dataTransfer.files);
        }}
        className={cn(
          "group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed text-center outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent/50",
          compact ? "gap-2 px-4 py-5" : "gap-3 px-6 py-16",
          dragging
            ? "border-accent bg-accent/5"
            : "border-line hover:border-zinc-400 hover:bg-surface-2 dark:hover:border-zinc-600",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-xl bg-surface-2 text-muted transition-colors group-hover:text-fg",
            compact ? "h-9 w-9" : "h-12 w-12",
            dragging && "text-accent",
          )}
        >
          <IconUpload className={compact ? "h-[18px] w-[18px]" : "h-6 w-6"} />
        </span>
        {compact ? (
          <span className="text-sm text-muted">
            <span className="font-medium text-fg">Add more</span> or drop here
          </span>
        ) : (
          <span className="space-y-1">
            <span className="block text-[15px] font-medium text-fg">
              Drop images, or <span className="text-accent">browse</span>
            </span>
            <span className="block text-sm text-muted">
              Up to 20 at once · converted on your device
            </span>
          </span>
        )}
      </button>
    </>
  );
}
