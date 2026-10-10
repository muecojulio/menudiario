import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({ component: Privacy });

function Privacy() {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 py-8 pb-16">
      <Link to="/" className="text-sm text-clay">
        Volver
      </Link>
      <h1 className="mt-4 font-display text-4xl text-fg">Privacidad</h1>
      <div className="mt-6 space-y-4 text-sm leading-6 text-muted">
        <p className="text-fg">
          Menú Diario no pide cuenta. Tu presupuesto, las personas en casa y la lista de compras se
          quedan en este teléfono.
        </p>
        <p>
          El servidor solo consulta datos públicos de alimentos y precios: Open Prices y Open Food
          Facts (licencia ODbL) y recetas abiertas de TheMealDB. Esas consultas no incluyen tu
          nombre, tu presupuesto ni tu ubicación.
        </p>
        <p>
          Los precios públicos se guardan en caché unas horas para no repetir las mismas consultas.
          Esa caché no tiene datos tuyos. Hay un índice por fecha para leerla rápido y descartar lo
          viejo.
        </p>
        <p>
          No enviamos tu menú a Zapier, Hugging Face, Firecrawl ni a ninguna automatización. Eso
          sacaría de tu teléfono lo que comes y cuánto gastas, y esta app no lo necesita.
        </p>
        <p>
          Los precios de cadena son una referencia para comprar en Walmart, Bodega Aurrerá, Soriana,
          Chedraui, HEB y La Comer. Cuando un anaquel público coincide con el producto, se usa ese
          precio y se marca como visto.
        </p>
        <p>Puedes borrar el plan en la pestaña Más. Con eso se limpia lo guardado en este aparato.</p>
      </div>
    </main>
  );
}
