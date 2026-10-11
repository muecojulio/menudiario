import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Panel plegable con animación de altura (grid 0fr → 1fr) y estado accesible. */
export function Disclosure({
  id,
  title,
  summary,
  defaultOpen = false,
  children,
  className = "",
}: {
  id: string;
  title: ReactNode;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;
  return (
    <div className={className}>
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="press flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left"
      >
        <span className="min-w-0">
          <span className="block font-display text-lg text-fg">{title}</span>
          {summary ? <span className="block text-xs text-muted">{summary}</span> : null}
        </span>
        <ChevronDown
          size={20}
          aria-hidden
          className={`shrink-0 text-muted transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        inert={!open}
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0.4 }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
