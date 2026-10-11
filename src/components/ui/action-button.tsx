import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import type { ActionStatus } from "@/lib/use-async-action";

export type { ActionStatus };

const VARIANT: Record<"primary" | "secondary" | "ghost" | "danger", string> = {
  primary: "bg-clay text-bg shadow-[0_12px_24px_-16px_rgba(224,138,69,0.9)] hover:brightness-105",
  secondary: "bg-raise text-fg border border-line",
  ghost: "text-fg",
  danger:
    "bg-[color-mix(in_srgb,var(--color-chile)_16%,transparent)] text-fg border border-chile/50",
};

type ActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  status: ActionStatus;
  onAction: () => void;
  variant?: keyof typeof VARIANT;
  icon?: ReactNode;
  loadingText: string;
  successText: string;
  errorText: string;
  fullWidth?: boolean;
  children: ReactNode;
};

/**
 * Botón con estados de carga (aria-busy, sin envíos duplicados), éxito (icono + texto)
 * y error (icono con sacudida breve y texto, nunca solo color).
 */
export function ActionButton({
  status,
  onAction,
  variant = "primary",
  icon,
  loadingText,
  successText,
  errorText,
  fullWidth,
  className = "",
  children,
  disabled,
  ...rest
}: ActionButtonProps) {
  const label =
    status === "loading"
      ? loadingText
      : status === "success"
        ? successText
        : status === "error"
          ? errorText
          : children;
  const glyph =
    status === "loading" ? (
      <Loader2 size={18} className="animate-spin" aria-hidden />
    ) : status === "success" ? (
      <Check size={18} className="anim-pop" aria-hidden />
    ) : status === "error" ? (
      <AlertCircle size={18} className="anim-shake" aria-hidden />
    ) : (
      icon
    );

  return (
    <>
      <button
        type="button"
        {...rest}
        disabled={disabled}
        aria-disabled={status === "loading" || undefined}
        aria-busy={status === "loading" || undefined}
        data-status={status}
        onClick={() => {
          if (status !== "loading") onAction();
        }}
        className={`press inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium ${VARIANT[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      >
        {glyph}
        <span>{label}</span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {status === "success" ? successText : status === "error" ? errorText : ""}
      </span>
    </>
  );
}
