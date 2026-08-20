interface IconProps {
  className?: string;
}

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconUpload({ className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false" {...base}>
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      <path d="M12 15V4" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

export function IconDownload({ className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false" {...base}>
      <path d="M12 4v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false" {...base}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false" {...base}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconArrowRight({ className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false" {...base}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false" {...base}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconImage({ className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false" {...base}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m5 19 5.5-5.5a1.4 1.4 0 0 1 2 0L19 20" />
      <path d="m15 16 1.5-1.5a1.4 1.4 0 0 1 2 0L21 17" />
    </svg>
  );
}

export function IconSliders({ className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false" {...base}>
      <path d="M4 8h9" />
      <path d="M17 8h3" />
      <circle cx="15" cy="8" r="2" />
      <path d="M4 16h3" />
      <path d="M11 16h9" />
      <circle cx="9" cy="16" r="2" />
    </svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false" {...base}>
      <path d="M12 3 5 6v5c0 4.4 3 8.4 7 9.7 4-1.3 7-5.3 7-9.7V6l-7-3Z" />
    </svg>
  );
}

export function IconLock({ className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false" {...base}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconSpinner({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
