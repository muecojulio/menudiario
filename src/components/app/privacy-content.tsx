/**
 * Política de privacidad. Vive en un solo componente: lo muestra la pestaña "Privacidad"
 * de la app y la ruta /privacidad, para que ambas digan exactamente lo mismo.
 */
const PRIVACY_UPDATED = "11 de octubre de 2026";
const SOURCE_LINK = "text-fg underline underline-offset-2 hover:text-clay";

export function PrivacyContent({ compact = false }: { compact?: boolean }) {
  const heading = compact ? "font-display text-2xl text-fg" : "font-display text-3xl text-fg";
  return (
    <div className="space-y-6 text-sm leading-6 text-muted">
      <p className="text-fg">
        Menú Diario no pide cuenta, no usa cookies de seguimiento y no tiene analítica ni
        publicidad. Tu presupuesto, las personas, el menú y la lista se quedan en este teléfono. La
        ciudad solo sirve para consultar el clima con coordenadas predefinidas.
      </p>
      <p className="text-xs">Última actualización: {PRIVACY_UPDATED}.</p>

      <section className="space-y-2">
        <h2 className={heading}>Qué se guarda en tu teléfono</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Preferencias: presupuesto, días, personas, comidas, bebida, supermercado y ciudad.
          </li>
          <li>El plan armado y las casillas marcadas en la lista de compras.</li>
        </ul>
        <p>
          Se guarda en el almacenamiento local del navegador (claves <code>menudiario-prefs</code>,{" "}
          <code>menudiario-plan</code> y <code>menudiario-checks</code>). Puedes borrar el menú
          guardado y el progreso de compra en <span className="text-fg">QR → Borrar el plan</span>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={heading}>Qué consultamos en internet</h2>
        <p>
          El servidor consulta fuentes públicas sin clave ni registro. Tu presupuesto, menú y lista
          no se envían a esas fuentes. La ciudad elegida se usa para pedir el pronóstico mediante
          coordenadas de una lista fija de 12 ciudades; no usamos el GPS.
        </p>
        <p>
          Si usas “Explora etiquetas”, el término de producto que escribiste se envía a nuestro
          servidor y desde ahí a Open Food Facts. No incluyas datos personales. La búsqueda no
          incluye tu presupuesto, menú ni lista; su respuesta se conserva solo en memoria del
          servidor hasta 30 minutos y no se guarda en la base de datos.
        </p>
        <p>
          Las APIs consultadas desde el servidor reciben su IP. Al cargar una imagen o abrir un
          enlace externo, ese proveedor también puede recibir datos técnicos del navegador. Las
          imágenes y enlaces se limitan a dominios permitidos.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={heading}>Fuentes y licencias</h2>
        <p>Estas son las fuentes públicas consultadas y las licencias o condiciones aplicables:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={SOURCE_LINK}
            >
              Open-Meteo
            </a>
            : pronóstico del clima; uso no comercial y atribución bajo{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/deed.es"
              target="_blank"
              rel="noopener noreferrer"
              className={SOURCE_LINK}
            >
              CC BY 4.0
            </a>
            .
          </li>
          <li>
            <a
              href="https://date.nager.at/"
              target="_blank"
              rel="noopener noreferrer"
              className={SOURCE_LINK}
            >
              Nager.Date
            </a>
            : días festivos de México; licencia{" "}
            <a
              href="https://opensource.org/license/mit/"
              target="_blank"
              rel="noopener noreferrer"
              className={SOURCE_LINK}
            >
              MIT
            </a>
            .
          </li>
          <li>
            <a
              href="https://prices.openfoodfacts.org/"
              target="_blank"
              rel="noopener noreferrer"
              className={SOURCE_LINK}
            >
              Open Prices
            </a>
            : precios observados en anaquel; software bajo{" "}
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
              className={SOURCE_LINK}
            >
              AGPL-3.0
            </a>
            y datos bajo{" "}
            <a
              href="https://opendatacommons.org/licenses/odbl/"
              target="_blank"
              rel="noopener noreferrer"
              className={SOURCE_LINK}
            >
              ODbL
            </a>
            .
          </li>
          <li>
            <a
              href="https://world.openfoodfacts.org/"
              target="_blank"
              rel="noopener noreferrer"
              className={SOURCE_LINK}
            >
              Open Food Facts
            </a>
            : productos, etiquetas y búsquedas iniciadas por la persona usuaria; datos bajo{" "}
            <a
              href="https://opendatacommons.org/licenses/odbl/"
              target="_blank"
              rel="noopener noreferrer"
              className={SOURCE_LINK}
            >
              ODbL
            </a>
            .
          </li>
          <li>
            <a
              href="https://www.themealdb.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={SOURCE_LINK}
            >
              TheMealDB
            </a>
            : ideas y recetas mexicanas; consulta sus condiciones en el sitio del servicio.
          </li>
          <li>
            <a
              href="https://es.wikipedia.org/"
              target="_blank"
              rel="noopener noreferrer"
              className={SOURCE_LINK}
            >
              Wikipedia en español
            </a>
            : descripciones de ingredientes bajo{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/deed.es"
              target="_blank"
              rel="noopener noreferrer"
              className={SOURCE_LINK}
            >
              CC BY-SA 4.0
            </a>
            .
          </li>
        </ul>
        <p>
          Las licencias corresponden a cada fuente y a sus datos; consulta sus sitios para conocer
          los términos completos.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={heading}>Caché</h2>
        <p>
          Las respuestas públicas se guardan unas horas o días para no repetir consultas. Esa caché
          contiene únicamente datos públicos de clima, precios, festivos y recetas; no contiene
          datos tuyos.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={heading}>Lo que no hacemos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>No vendemos ni compartimos tu menú ni tus gastos con terceros.</li>
          <li>No enviamos tu plan a automatizaciones ni a servicios de IA externos.</li>
          <li>No pedimos tu ubicación ni acceso a cámara, micrófono o contactos.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className={heading}>Precios de referencia</h2>
        <p>
          Las cadenas no publican una lista oficial gratuita. Los precios de Walmart, Bodega
          Aurrerá, Soriana, Chedraui, HEB y La Comer son una referencia para presupuestar. Cuando un
          anaquel público coincide con un producto, se usa ese precio y se marca como visto.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={heading}>Tus opciones</h2>
        <p>
          Como no guardamos tus datos personales en servidores, no hay cuenta que cerrar. Para
          borrar lo guardado en este aparato, usa{" "}
          <span className="text-fg">QR → Borrar el plan de este teléfono</span>. Para preguntas
          sobre privacidad, abre un issue en el repositorio público.
        </p>
      </section>
    </div>
  );
}
