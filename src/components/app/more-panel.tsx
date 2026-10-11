import { useEffect, useState } from "react";
import { Github, Star, Trash2, Smartphone, ShieldCheck } from "lucide-react";
import { getRepoInfo } from "@/lib/public-api.functions";
import type { RepoInfo } from "@/lib/public-api/parsers";
import type { MarketLive } from "@/lib/market.functions";
import { ActionButton } from "@/components/ui/action-button";
import { useAsyncAction } from "@/lib/use-async-action";
import { Disclosure } from "@/components/ui/disclosure";
import { FoodSearch } from "@/components/food-search";
import { CARD, ExternalLink, ShelfNote } from "./parts";

const REPO_URL = "https://github.com/muecojulio/menudiario";

export function MorePanel({
  live,
  onInstall,
  onPrivacy,
  onClear,
}: {
  live: MarketLive | null;
  onInstall: () => void;
  onPrivacy: () => void;
  onClear: () => void;
}) {
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const clear = useAsyncAction();

  useEffect(() => {
    let cancelled = false;
    getRepoInfo()
      .then((info) => !cancelled && setRepo(info))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-5 px-5 py-5 text-sm leading-6 text-muted">
      <h2 className="font-display text-4xl text-fg">Más</h2>

      <FoodSearch />

      <div className={`${CARD} space-y-3`}>
        <p className="flex items-center gap-2 text-fg">
          <Smartphone size={18} aria-hidden className="text-clay" />
          Instálala en la pantalla de inicio
        </p>
        <p>
          Se abre como app, sin la barra del navegador, y funciona con el mismo menú que ya armaste.
        </p>
        <button
          type="button"
          onClick={onInstall}
          className="press inline-flex min-h-11 w-full items-center justify-center rounded-full bg-clay px-4 py-3 text-base text-bg"
        >
          Instalar en el teléfono
        </button>
      </div>

      {repo ? (
        <div className={`${CARD} space-y-2`}>
          <p className="flex items-center gap-2 text-fg">
            <Github size={18} aria-hidden />
            Código abierto
          </p>
          <p>
            {repo.description ?? "Proyecto público en GitHub."}
            {repo.license ? ` Licencia ${repo.license}.` : ""}
          </p>
          <p className="flex items-center gap-1.5 text-xs tabular-nums">
            <Star size={13} aria-hidden /> {repo.stars.toLocaleString("es-MX")} estrellas
            {repo.pushedAt
              ? ` · última actualización ${new Date(repo.pushedAt).toLocaleDateString("es-MX")}`
              : ""}
          </p>
          <ExternalLink href={REPO_URL}>Ver el repositorio</ExternalLink>
        </div>
      ) : null}

      <Disclosure
        id="fuentes"
        title="Fuentes y licencias"
        summary="Datos públicos, sin clave ni registro"
      >
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Open-Meteo: pronóstico del clima (uso no comercial, CC BY 4.0).</li>
          <li>Nager.Date: días festivos de México (MIT).</li>
          <li>Open Prices y Open Food Facts: precios y productos (ODbL).</li>
          <li>TheMealDB: recetas mexicanas.</li>
          <li>Wikipedia en español: descripciones de ingredientes (CC BY-SA 4.0).</li>
        </ul>
        <div className="mt-3">
          <ShelfNote live={live} matches={0} />
        </div>
      </Disclosure>

      <div className={`${CARD} space-y-3`}>
        <button
          type="button"
          onClick={onPrivacy}
          className="press inline-flex min-h-11 w-full items-center justify-start gap-2 text-fg"
        >
          <ShieldCheck size={18} aria-hidden className="text-clay" />
          Política de privacidad
        </button>
        <ActionButton
          variant="danger"
          status={clear.status}
          onAction={() => void clear.run(onClear)}
          icon={<Trash2 size={16} aria-hidden />}
          loadingText="Borrando…"
          successText="Plan borrado"
          errorText="No se pudo borrar"
          fullWidth
        >
          Borrar el plan de este teléfono
        </ActionButton>
      </div>
    </section>
  );
}
