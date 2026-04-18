function IconBase({ size = 16, children }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

export function Search({ size }) {
  return (
    <IconBase size={size}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </IconBase>
  );
}

export function Plus({ size }) {
  return (
    <IconBase size={size}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function ChevronDown({ size }) {
  return (
    <IconBase size={size}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function ChevronRight({ size }) {
  return (
    <IconBase size={size}>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  );
}

export function X({ size }) {
  return (
    <IconBase size={size}>
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}

export function Trash2({ size }) {
  return (
    <IconBase size={size}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </IconBase>
  );
}

export function PencilLine({ size }) {
  return (
    <IconBase size={size}>
      <path d="M4 20h16" />
      <path d="m14.5 5.5 4 4" />
      <path d="M6 17.5 8 12l8.5-8.5a1.4 1.4 0 0 1 2 0l2 2a1.4 1.4 0 0 1 0 2L12 16l-6 1.5Z" />
    </IconBase>
  );
}

export function ExternalLink({ size }) {
  return (
    <IconBase size={size}>
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
    </IconBase>
  );
}

export function FolderKanban({ size }) {
  return (
    <IconBase size={size}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      <path d="M8 11v4" />
      <path d="M12 10v5" />
      <path d="M16 12v3" />
    </IconBase>
  );
}

export function GripVertical({ size }) {
  return (
    <IconBase size={size}>
      <path d="M10 6h.01" />
      <path d="M10 12h.01" />
      <path d="M10 18h.01" />
      <path d="M14 6h.01" />
      <path d="M14 12h.01" />
      <path d="M14 18h.01" />
    </IconBase>
  );
}
