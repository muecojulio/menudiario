import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/** Hoja modal inferior (Radix Dialog): foco atrapado, Escape y cierre accesibles. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl border-t border-line bg-surface shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.8)] focus:outline-none data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out">
          <div aria-hidden className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-raise" />
          <div className="flex items-start justify-between gap-3 px-5 pt-3">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-2xl text-fg">{title}</Dialog.Title>
              <Dialog.Description className={description ? "mt-1 text-sm text-muted" : "sr-only"}>
                {description ?? title}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Cerrar"
              className="press grid h-11 w-11 shrink-0 place-items-center rounded-full bg-raise text-fg"
            >
              <X size={18} aria-hidden />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
