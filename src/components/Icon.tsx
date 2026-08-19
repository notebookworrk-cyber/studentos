interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

const paths: Record<string, React.ReactNode> = {
  home: (
    <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />
  ),
  calendar: (
    <path d="M4 5h16v16H4zM4 9h16M8 3v4M16 3v4M8 14h2M12 14h2M8 17h2M12 17h2" />
  ),
  tasks: (
    <path d="M4 6h3M4 12h3M4 18h3M9 6h11M9 12h11M9 18h11" />
  ),
  notes: (
    <path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7" />
  ),
  timer: (
    <path d="M12 8v5l3 2M9 3h6M12 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
  ),
  study: (
    <path d="M12 6c-2.5-1.8-6-2-10-1.5v14c4-.5 7.5-.3 10 1.5 2.5-1.8 6-2 10-1.5v-14c-4-.5-7.5-.3-10 1.5zM12 6v14" />
  ),
  projects: (
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  ),
  code: (
    <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13 5l-2 14" />
  ),
  research: (
    <path d="M10 3v6a3 3 0 0 1-6 0V3M7 3v4a3 3 0 0 1-3 3M17 3v8a5 5 0 0 1-10 0M7 21h10M12 21v-7" />
  ),
  ai: (
    <path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9zM5 17l.7 1.6L7.5 19l-1.8.8L5 21l-.7-1.2L2.5 19l1.8-.4z" />
  ),
  files: (
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  ),
  browser: (
    <path d="M3 7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM3 9h18M8 5v2" />
  ),
  terminal: (
    <path d="M4 5h16v14H4zM7 10l3 3-3 3M13 15h4" />
  ),
  lock: (
    <path d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5zM12 15v3" />
  ),
  settings: (
    <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM19 12c0-.6-.1-1.1-.2-1.7l2-1.5-2-3.4-2.3 1a8 8 0 0 0-3-1.7L13.3 2h-4l-.2 2.7a8 8 0 0 0-3 1.7l-2.3-1-2 3.4 2 1.5c-.1.6-.2 1.1-.2 1.7s.1 1.1.2 1.7l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 3 1.7l.2 2.7h4l.2-2.7a8 8 0 0 0 3-1.7l2.3 1 2-3.4-2-1.5c.1-.6.2-1.1.2-1.7z" />
  ),
  play: (
    <path d="M8 5.5v13l11-6.5z" />
  ),
  plus: (
    <path d="M12 5v14M5 12h14" />
  ),
  undo: (
    <path d="M9 14 4 9l5-5M4 9h10a6 6 0 1 1 0 12h-3" />
  ),
  pause: (
    <path d="M9 5v14M15 5v14" />
  ),
  note: (
    <path d="M6 3h9l4 4v14H6zM15 3v4h4M9 15h7M9 11h7" />
  ),
  check: (
    <path d="M4 12.5l5 5L20 6.5" />
  ),
  spark: (
    <path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z" />
  ),
  arrow: (
    <path d="M5 12h14M13 6l6 6-6 6" />
  ),
  focus: (
    <path d="M12 12m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0" />
  ),
  search: (
    <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.5-4.5" />
  ),
  trash: (
    <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
  ),
  edit: (
    <path d="M4 20h4l11-11-4-4L4 16v4zM13.5 6.5l4 4" />
  ),
  x: (
    <path d="M6 6l12 12M18 6 6 18" />
  ),
  chevL: (
    <path d="M15 5l-7 7 7 7" />
  ),
  chevR: (
    <path d="M9 5l7 7-7 7" />
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  list: (
    <>
      <path d="M4 6h16M4 12h16M4 18h10" />
      <circle cx="7" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3" />
  ),
  flag: (
    <path d="M5 21V4M5 4c2-1.5 5-1.5 7 0s5 1.5 7 0v9c-2 1.5-5 1.5-7 0s-5-1.5-7 0" />
  ),
  filter: (
    <path d="M4 6h16M7 12h10M10 18h4" />
  ),
  sort: (
    <path d="M8 5v14M8 5 5 8M8 5l3 3M16 19V5M16 19l-3-3M16 19l3-3" />
  ),
  dot: (
    <circle cx="12" cy="12" r="4" />
  ),
  folder: (
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  ),
  file: (
    <path d="M6 3h8l4 4v14H6zM14 3v4h4" />
  ),
  pin: (
    <path d="M9 4h6v3l1.5 2H18v2h-1l-2 5V21h-6v-5l-2-5H6V9h1.5L9 7z" />
  ),
  star: (
    <path d="M12 3l2.7 5.6 6.3.8-4.6 4.3 1.2 6.1L12 16.9 6.4 19.8l1.2-6.1L3 9.4l6.3-.8z" />
  ),
  back: (
    <path d="M19 12H5M11 6l-6 6 6 6" />
  ),
  tag: (
    <path d="M3 11V4h7l11 11-7 7zM8 8h.01" />
  ),
  book: (
    <path d="M4 5a2 2 0 0 1 2-2h4v16H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-4v16h4a2 2 0 0 1 2 2zM12 3v16" />
  ),
  video: (
    <path d="M4 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v2l3-2v8l-3-2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
  ),
  chart: (
    <path d="M4 20V4M4 20h16M8 16v-5M13 16V7M18 16v-8" />
  ),
  layers: (
    <path d="M12 3l9 5-9 5-9-5zM12 13l9 5-9 5-9-5z" />
  ),
  target: (
    <path d="M12 12m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0M12 12m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0" />
  ),
  grad: (
    <path d="M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 9v6" />
  ),
  ext: (
    <path d="M14 5h5v5M19 5l-8 8M10 7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  ),
  expand: (
    <path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4M9 12h6M12 9v6" />
  ),
  download: (
    <path d="M12 3v12M8 11l4 4 4-4M4 17v2h16v-2" />
  ),
  collapse: (
    <path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4M5 15l3-3-3-3M19 15l-3-3 3-3" />
  ),
  copy: (
    <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M16 4h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2M16 4v12" />
  ),
  close: (
    <path d="M6 6l12 12M18 6L6 18" />
  ),
  bell: (
    <path d="M12 4a5 5 0 0 1 5 5c0 3 1 4 2 5H5c1-1 2-2 2-5a5 5 0 0 1 5-5zM10 19a2 2 0 0 0 4 0" />
  ),
};

export function Icon({ name, size = 18, className = "" }: IconProps) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name] ?? paths.focus}
    </svg>
  );
}
