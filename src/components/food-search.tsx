import { useState, type FormEvent } from "react";
import { ArrowUpRight, Search, Sparkles } from "lucide-react";
import { searchOpenFoods, type FoodSearchResult } from "@/lib/food-search.functions";

export function FoodSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<FoodSearchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 2) {
      setMessage("Escribe al menos dos letras para buscar.");
      setResult(null);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await searchOpenFoods({ data: { query: term } });
      setResult(response);
      setMessage(
        response.ok
          ? `${response.products.length} productos encontrados${response.cached ? " · resultado guardado unos minutos" : ""}.`
          : response.issue === "rate-limited"
            ? "Por ahora hay muchas búsquedas activas. Espera un minuto e inténtalo de nuevo."
            : response.issue === "unavailable"
              ? "Open Food Facts no respondió. Intenta de nuevo en un momento."
              : "No hubo coincidencias. Prueba con otro nombre de alimento.",
      );
    } catch {
      setResult(null);
      setMessage("Open Food Facts no respondió. Intenta de nuevo en un momento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="food-search-card" aria-labelledby="food-search-title">
      <div className="food-search-heading">
        <span className="food-search-icon" aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <div>
          <p className="eyebrow">Despensa abierta</p>
          <h3 id="food-search-title" className="font-display text-2xl text-fg">
            Explora etiquetas
          </h3>
        </div>
      </div>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
        Busca un alimento para consultar productos, Nutri-Score y algunos datos por cada 100 g. La
        información la aportan las etiquetas de la comunidad.
      </p>

      <form className="food-search-form" onSubmit={(event) => void submit(event)}>
        <label className="sr-only" htmlFor="food-query">
          Alimento para buscar
        </label>
        <input
          id="food-query"
          autoComplete="off"
          maxLength={60}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Prueba: avena, leche, frijol…"
        />
        <button type="submit" className="button-primary search-submit" disabled={busy}>
          <Search size={17} aria-hidden="true" />
          {busy ? "Buscando" : "Buscar"}
        </button>
      </form>
      <p className="text-xs leading-5 text-muted" aria-live="polite">
        {message || "Se envía solo este término a Open Food Facts; no incluyas datos personales."}
      </p>

      {result?.products.length ? (
        <ul className="food-result-grid" aria-label="Productos encontrados">
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
              <div className="nutrient-chips">
                {product.kcal != null ? <span>{product.kcal} kcal / 100 g</span> : null}
                {product.protein != null ? <span>{product.protein} g proteína</span> : null}
                {product.sugars != null ? <span>{product.sugars} g azúcares</span> : null}
                {product.kcal == null && product.protein == null && product.sugars == null ? (
                  <span>Etiqueta sin datos nutricionales completos</span>
                ) : null}
              </div>
              <a
                className="food-source-link"
                href={product.sourceUrl}
                target="_blank"
                rel="noreferrer"
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
