"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { IconImage, IconPlus } from "./icons";

const ACCEPT = "image/*,.heic,.heif,.tif,.tiff,.avif";

/**
 * File pickers. Drag & drop is handled at the page level (see Converter),
 * so these only need to open the browse dialog.
 *
 * - "block": Notion-style image block placeholder for the empty state.
 * - "row": the "+ New"-style row that sits at the bottom of the file list.
 */
export function Dropzone({
  onFiles,
  variant = "block",
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  variant?: "block" | "row";
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function emit(list: FileList | null) {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      multiple
      accept={ACCEPT}
      className="hidden"
      onChange={(e) => {
        emit(e.target.files);
        e.target.value = "";
      }}
    />
  );

  if (variant === "row") {
    return (
      <>
        {input}
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-2 px-3 py-[7px] text-sm text-muted outline-none transition-colors duration-100 hover:bg-wash focus-visible:bg-wash disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconPlus className="h-4 w-4" />
          <span>
            New image
            <span className="text-faint">
              {" "}
              · drop or paste anywhere on the page
            </span>
          </span>
        </button>
      </>
    );
  }

  return (
    <>
      {input}
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group flex w-full flex-col items-center justify-center gap-2.5 rounded-md bg-surface-2 px-6 py-14 text-center outline-none transition-colors duration-100",
          "hover:bg-[rgba(55,53,47,0.08)] focus-visible:ring-2 focus-visible:ring-accent/40 dark:hover:bg-[rgba(255,255,255,0.08)]",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <IconImage className="h-7 w-7 text-faint transition-colors duration-100 group-hover:text-muted" />
        <span className="space-y-1">
          <span className="block text-sm font-medium text-fg">Add images</span>
          <span className="block text-sm text-muted">
            Click to browse, drop files anywhere on the page, or paste from your
            clipboard
          </span>
        </span>
      </button>
    </>
  );
}
