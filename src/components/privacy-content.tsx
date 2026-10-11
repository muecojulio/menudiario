import { ShieldCheck, Sparkles } from "lucide-react";

const sources = [
  {
    name: "Open Prices",
    detail: "Precios comunitarios publicados en MXN para orientar el costo del anaquel.",
    href: "https://prices.openfoodfacts.org/",
  },
  {
    name: "TheMealDB",
    detail: "Ideas de recetas mexicanas e imágenes públicas para inspirar el menú.",
    href: "https://www.themealdb.com/",
  },
  {
    name: "Open Food Facts",
    detail: "Fichas de productos y datos nutricionales cuando tú haces una búsqueda.",
    href: "https://world.openfoodfacts.org/",
  },
];

export function PrivacyContent() {
  return (
    <article className="privacy-page" aria-labelledby="privacy-title">
      <div className="privacy-hero">
        <span className="eyebrow-pill">
          <ShieldCheck size={15} /> Tus datos, en su sitio
        </span>
        <h1
          id="privacy-title"
          className="mt-4 font-display text-4xl leading-tight text-fg sm:text-5xl"
        >
          Aviso de privacidad
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          Menú Diario no crea cuentas ni sincroniza tu menú personal. Solo envía a su servidor el
          término de producto cuando tú inicias una búsqueda nutricional.
        </p>
        <p className="privacy-date">Última actualización: 11 de octubre de 2026</p>
      </div>

      <div className="privacy-summary">
        <span className="summary-spark" aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <div>
          <p className="font-display text-xl text-fg">En breve</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Tu presupuesto, preferencias, menú y lista de compra se guardan localmente en este
            dispositivo. Las consultas de precios usan información pública; una búsqueda nutricional
            solo se envía si tú la inicias.
          </p>
        </div>
      </div>

      <div className="privacy-sections">
        <section className="privacy-section">
          <span className="privacy-number">01</span>
          <div>
            <h2>Qué se guarda en este dispositivo</h2>
            <p>
              El presupuesto, los días y personas elegidos, las comidas activadas, el menú generado
              y las marcas de la lista se guardan en el almacenamiento local del navegador. No se
              almacenan en una cuenta ni se sincronizan entre dispositivos. El almacenamiento del
              navegador puede borrarse desde sus ajustes.
            </p>
          </div>
        </section>

        <section className="privacy-section">
          <span className="privacy-number">02</span>
          <div>
            <h2>Qué se consulta en servicios públicos</h2>
            <p>
              Para mostrar referencias actuales, Menú Diario consulta precios públicos de Open
              Prices e ideas de receta de TheMealDB. El servidor guarda temporalmente solo esas
              respuestas públicas: hasta seis horas como datos recientes y, si las fuentes no
              responden, puede mostrar una copia de respaldo de hasta siete días.
            </p>
            <p>
              Si usas “Explora etiquetas”, se envía a Open Food Facts el nombre del alimento que
              escribiste. Esa búsqueda no incluye tu presupuesto, lista, menú ni ubicación. No
              escribas datos personales en el campo. Los resultados se conservan temporalmente en
              memoria del servidor por un máximo de treinta minutos; no se guardan las búsquedas en
              una base persistente.
            </p>
            <p>
              Al abrir las tarjetas de ideas, las imágenes se cargan desde TheMealDB. Como cualquier
              solicitud web, los servicios externos pueden recibir datos técnicos de conexión como
              la dirección IP o el navegador. Consulta sus avisos para conocer sus prácticas.
            </p>
          </div>
        </section>

        <section className="privacy-section">
          <span className="privacy-number">03</span>
          <div>
            <h2>Fuentes y calidad de la información</h2>
            <ul className="privacy-sources">
              {sources.map((source) => (
                <li key={source.name}>
                  <div>
                    <a href={source.href} target="_blank" rel="noreferrer">
                      {source.name}
                    </a>
                    <p>{source.detail}</p>
                  </div>
                  <span aria-hidden="true">↗</span>
                </li>
              ))}
            </ul>
            <p>
              Son fuentes independientes y colaborativas. Los precios pueden variar por tienda,
              ciudad o fecha; las fichas nutricionales pueden estar incompletas. Úsalas como
              referencia, no como garantía de precio ni consejo médico.
            </p>
          </div>
        </section>

        <section className="privacy-section">
          <span className="privacy-number">04</span>
          <div>
            <h2>Compartir y eliminar</h2>
            <p>
              El código QR descarga únicamente el enlace público de la app; no contiene tu plan ni
              tu lista. Puedes borrar preferencias, menú y lista desde la pestaña “Más”. También
              puedes eliminar los datos del sitio desde los ajustes de tu navegador.
            </p>
            <p>
              No usamos las búsquedas para anuncios ni vendemos datos personales. Menú Diario no
              solicita cuenta, correo ni datos de pago.
            </p>
          </div>
        </section>

        <section className="privacy-section">
          <span className="privacy-number">05</span>
          <div>
            <h2>Cambios a este aviso</h2>
            <p>
              Si cambia la forma en que funciona la app o se agregan nuevos servicios,
              actualizaremos este aviso y su fecha. Esta página describe las funciones actualmente
              disponibles.
            </p>
          </div>
        </section>
      </div>

      <p className="privacy-footer">
        Hecha para cocinar con calma y compartir solo lo necesario. 🌿
      </p>
    </article>
  );
}
