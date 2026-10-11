import { useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Loader2, Search, Sparkles } from "lucide-react";
import { searchOpenFoods, type FoodSearchResult } from "@/lib/food-search.functions";

export function FoodSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<FoodSearchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    const term = query.trim();
    if (term.length < 2) {
      setMessage("Escribe al menos dos letras para buscar.");
      setResult(null);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setMessage("Buscando productos…");
    try {
      const response = await searchOpenFoods({ data: { query: term } });
      setResult(response);
      setMessage(
        response.ok
          ? `${response.products.length} productos encontrados${response.cached ? " · en caché" : ""}.`
          : response.issue === "rate-limited"
            ? "Hay muchas búsquedas en curso. Espera un minuto y prueba otra vez."
            : response.issue === "unavailable"
              ? "Open Food Facts no respondió. Intenta de nuevo en un momento."
              : "No hubo coincidencias. Prueba con otro nombre de alimento.",
      );
    } catch {
      setResult(null);
      setMessage("Open Food Facts no respondió. Intenta de nuevo en un momento.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="food-search-card p-4 sm:p-5" aria-labelledby="food-query-title">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-clay-soft text-clay">
          <Sparkles size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-leaf">
            Despensa abierta
          </p>
          <h3 id="food-query-title" className="mt-0.5 font-display text-2xl text-fg">
            Explora etiquetas
          </h3>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        Busca productos, Nutri-Score y algunos datos por cada 100 g. La información proviene de
        etiquetas aportadas por la comunidad.
      </p>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        aria-busy={busy}
        onSubmit={(event) => void submit(event)}
      >
        <label className="sr-only" htmlFor="food-query">
          Alimento para buscar
        </label>
        <input
          id="food-query"
          className="field min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-sm text-fg"
          autoComplete="off"
          maxLength={60}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Prueba: avena, leche, frijol…"
        />
        <button
          type="submit"
          className="press inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-clay px-5 text-sm font-semibold text-bg disabled:opacity-50"
          disabled={busy}
          aria-busy={busy || undefined}
        >
          {busy ? (
            <Loader2 size={17} className="animate-spin" aria-hidden="true" />
          ) : (
            <Search size={17} aria-hidden="true" />
          )}
          {busy ? "Buscando…" : "Buscar"}
        </button>
      </form>
      <p
        className="mt-2 min-h-5 text-xs leading-5 text-muted"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {message || "Se envía solo este término a Open Food Facts; no incluyas datos personales."}
      </p>

      {result?.products.length ? (
        <ul className="mt-3 grid gap-3" aria-label="Productos encontrados">
          {result.products.map((product, index) => (
            <li key={`${product.sourceUrl}-${index}`} className="food-result-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight text-fg">{product.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {[product.brand, product.quantity].filter(Boolean).join(" · ") ||
                      "Producto comunitario"}
                  </p>
                </div>
                {product.nutriScore ? (
                  <span
                    className={`nutri-score grade-${product.nutriScore}`}
                    aria-label={`Nutri-Score ${product.nutriScore.toUpperCase()}`}
                    title={`Nutri-Score ${product.nutriScore.toUpperCase()}`}
                  >
                    {product.nutriScore.toUpperCase()}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-fg">
                {product.kcal != null ? (
                  <span className="rounded-full bg-raise px-2.5 py-1">
                    {product.kcal} kcal / 100 g
                  </span>
                ) : null}
                {product.protein != null ? (
                  <span className="rounded-full bg-raise px-2.5 py-1">
                    {product.protein} g proteína
                  </span>
                ) : null}
                {product.sugars != null ? (
                  <span className="rounded-full bg-raise px-2.5 py-1">
                    {product.sugars} g azúcares
                  </span>
                ) : null}
                {product.kcal == null && product.protein == null && product.sugars == null ? (
                  <span className="rounded-full bg-raise px-2.5 py-1">
                    Etiqueta sin datos nutricionales completos
                  </span>
                ) : null}
              </div>
              <a
                className="food-source-link"
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver ficha en Open Food Facts <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-muted">
        Datos colaborativos, incompletos y orientativos; no sustituyen una etiqueta verificada ni
        consejo nutricional.
      </p>
    </section>
  );
}
