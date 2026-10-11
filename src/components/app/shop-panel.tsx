import { useState, type KeyboardEvent } from "react";
import { Check, Copy, Info, ShoppingBasket } from "lucide-react";
import { money } from "@/lib/format";
import type { PlanResult, ShopLine } from "@/lib/planner";
import { ActionButton } from "@/components/ui/action-button";
import { useAsyncAction } from "@/lib/use-async-action";
import { SwipeRow } from "@/components/ui/swipe-row";
import { Empty } from "./parts";

function groupLines(lines: ShopLine[]): Array<[string, ShopLine[]]> {
  const groups = new Map<string, ShopLine[]>();
  for (const line of lines) {
    const list = groups.get(line.aisle) ?? [];
    list.push(line);
    groups.set(line.aisle, list);
  }
  return [...groups.entries()];
}

export function ShopPanel({
  plan,
  checks,
  onChecks,
  onInfo,
  onEmptyAction,
}: {
  plan: PlanResult | null;
  checks: string[];
  onChecks: (next: string[]) => void;
  onInfo: (line: { id: string; name: string }) => void;
  onEmptyAction: () => void;
}) {
  const [openRow, setOpenRow] = useState<string | null>(null);
  const copy = useAsyncAction();

  if (!plan) {
    return (
      <section>
        <Empty onPlan={onEmptyAction} />
      </section>
    );
  }

  const done = plan.lines.filter((line) => checks.includes(line.id)).length;
  const ratio = plan.lines.length ? done / plan.lines.length : 0;

  function toggle(id: string) {
    onChecks(checks.includes(id) ? checks.filter((item) => item !== id) : [...checks, id]);
  }

  async function copyList() {
    const text = [
      `Menú Diario · ${plan!.storeName}`,
      `${plan!.dayCount} días · ${plan!.people} ${plan!.people === 1 ? "persona" : "personas"}`,
      "",
      ...plan!.lines.map((line) => `${line.name} — ${line.buy} — ${money(line.cost)}`),
      "",
      `Total ${money(plan!.total)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
  }

  return (
    <section className="space-y-5 px-5 py-5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">{plan.storeName}</p>
          <h2 className="font-display text-4xl text-fg tabular-nums">{money(plan.total)}</h2>
        </div>
        <ActionButton
          variant="secondary"
          status={copy.status}
          onAction={() => void copy.run(copyList)}
          icon={<Copy size={16} aria-hidden />}
          loadingText="Copiando…"
          successText="Copiada"
          errorText="No se pudo copiar"
        >
          Copiar
        </ActionButton>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted">Comprado</span>
          <span className="tabular-nums text-fg" aria-live="polite">
            {done} de {plan.lines.length}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-raise"
          role="progressbar"
          aria-label="Productos comprados"
          aria-valuemin={0}
          aria-valuemax={plan.lines.length}
          aria-valuenow={done}
        >
          <div
            className="h-full rounded-full bg-clay transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-muted">
        Cantidades para {plan.dayCount} días y {plan.people}{" "}
        {plan.people === 1 ? "persona" : "personas"}. Compras el paquete completo; lo que sobra
        queda en casa. Desliza una fila (o usa ⋯) para ver sus acciones.
      </p>

      {groupLines(plan.lines).map(([aisle, lines]) => (
        <div key={aisle} className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm text-clay">
            <ShoppingBasket size={14} aria-hidden />
            {aisle}
          </h3>
          <ul className="space-y-2">
            {lines.map((line) => {
              const on = checks.includes(line.id);
              return (
                <li key={line.id}>
                  <SwipeRow
                    id={`row-${line.id}`}
                    label={line.name}
                    open={openRow === line.id}
                    onOpenChange={(next) => setOpenRow(next ? line.id : null)}
                    actions={
                      <>
                        <button
                          type="button"
                          onClick={() => onInfo({ id: line.id, name: line.name })}
                          className="press flex w-24 flex-col items-center justify-center gap-1 bg-raise text-xs text-fg"
                        >
                          <Info size={18} aria-hidden />
                          Ficha
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toggle(line.id);
                            setOpenRow(null);
                          }}
                          className={`press flex w-24 flex-col items-center justify-center gap-1 text-xs ${on ? "bg-raise text-fg" : "bg-clay text-bg"}`}
                        >
                          <Check size={18} aria-hidden />
                          {on ? "Quitar" : "Comprado"}
                        </button>
                      </>
                    }
                  >
                    <div
                      role="checkbox"
                      aria-checked={on}
                      tabIndex={0}
                      onClick={() => toggle(line.id)}
                      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                        if (event.key === " " || event.key === "Enter") {
                          event.preventDefault();
                          toggle(line.id);
                        }
                      }}
                      className={`flex min-h-14 min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-2xl bg-surface p-4 text-left transition-opacity duration-200 ${on ? "opacity-55" : ""}`}
                    >
                      <span
                        aria-hidden
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? "border-clay bg-clay text-bg" : "border-muted"}`}
                      >
                        {on ? <Check size={12} strokeWidth={3} /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className={`text-fg ${on ? "line-through decoration-muted" : ""}`}>
                            {line.name}
                          </span>
                          <span className="shrink-0 text-sm tabular-nums text-fg">
                            {money(line.cost)}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm text-muted">
                          Llevas {line.buy}. {line.use}.{line.extra ? ` ${line.extra}.` : ""}
                          {line.live ? " Precio visto en anaquel." : ""}
                        </span>
                      </span>
                    </div>
                  </SwipeRow>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
