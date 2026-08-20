"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "h-8 px-3 bg-accent text-white shadow-[inset_0_0_0_1px_rgba(15,15,15,0.1)] hover:bg-accent-strong active:scale-[0.98]",
  secondary:
    "h-8 px-3 border border-line-strong bg-surface text-fg shadow-[0_1px_2px_rgba(15,15,15,0.04)] hover:bg-surface-2 active:scale-[0.98]",
  ghost: "h-8 px-2.5 text-muted hover:bg-wash hover:text-fg",
  icon: "h-7 w-7 text-muted hover:bg-wash hover:text-fg",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "primary",
  className,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md text-sm font-medium outline-none transition-all duration-100 focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-md bg-surface-2 p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA radiogroup/radio pattern on buttons (segmented control)
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-7 rounded-[5px] px-2.5 text-sm outline-none transition-all duration-100 focus-visible:ring-2 focus-visible:ring-accent/40",
              active
                ? "bg-surface font-medium text-fg shadow-[0_1px_2px_rgba(15,15,15,0.08),0_0_0_1px_var(--line)]"
                : "font-normal text-muted hover:text-fg",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[18px] w-[30px] shrink-0 items-center rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent/40",
        checked ? "bg-accent" : "bg-[rgba(135,131,120,0.3)]",
      )}
    >
      <span
        className={cn(
          "inline-block h-[14px] w-[14px] transform rounded-full bg-white shadow-[0_1px_2px_rgba(15,15,15,0.2)] transition-transform duration-200",
          checked ? "translate-x-[14px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      aria-label="Quality"
      onChange={(e) => onChange(Number(e.target.value))}
      className="nslider cursor-pointer disabled:cursor-not-allowed"
      style={{ "--fill": `${fill}%` } as React.CSSProperties}
    />
  );
}

type TagColor = "gray" | "blue" | "green" | "red";

const TAG_STYLES: Record<TagColor, string> = {
  gray: "bg-[var(--tag-gray-bg)] text-[var(--tag-gray-fg)]",
  blue: "bg-[var(--tag-blue-bg)] text-[var(--tag-blue-fg)]",
  green: "bg-[var(--tag-green-bg)] text-[var(--tag-green-fg)]",
  red: "bg-[var(--tag-red-bg)] text-[var(--tag-red-fg)]",
};

/** Notion-style status tag: a small squarish pill, 12px text, muted color fill. */
export function Tag({
  color,
  children,
  title,
}: {
  color: TagColor;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-5 max-w-[180px] items-center gap-1 truncate whitespace-nowrap rounded-[3px] px-1.5 text-xs leading-none",
        TAG_STYLES[color],
      )}
    >
      {children}
    </span>
  );
}
