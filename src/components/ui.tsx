"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "h-11 px-5 bg-accent text-white shadow-sm hover:bg-accent-strong active:scale-[0.99]",
  secondary:
    "h-11 px-5 border border-line bg-surface text-fg hover:bg-surface-2",
  ghost: "h-9 px-3 text-muted hover:text-fg hover:bg-surface-2",
  icon: "h-9 w-9 text-muted hover:text-fg hover:bg-surface-2",
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
        "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50",
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
      className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1"
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
              "rounded-lg px-3.5 py-1.5 text-sm font-medium outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-accent/50",
              active
                ? "bg-surface text-fg shadow-sm"
                : "text-muted hover:text-fg",
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
        "relative inline-flex h-6 w-[42px] shrink-0 items-center rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent/50",
        checked ? "bg-accent" : "bg-zinc-300 dark:bg-zinc-700",
      )}
    >
      <span
        className={cn(
          "inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[21px]" : "translate-x-[3px]",
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
      className="w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      style={{ accentColor: "var(--accent)" }}
    />
  );
}
