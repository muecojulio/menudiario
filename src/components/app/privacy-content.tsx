/**
 * Política de privacidad. Vive en un solo componente: lo muestra la pestaña "Privacidad"
 * de la app y la ruta /privacidad, para que ambas digan exactamente lo mismo.
 */
const PRIVACY_UPDATED = "11 de octubre de 2026";

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
          <code>menudiario-plan</code> y <code>menudiario-checks</code>). Puedes borrarlo en la
          pestaña Más.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={heading}>Qué consultamos en internet</h2>
        <p>
          El servidor consulta fuentes públicas sin clave ni registro. El presupuesto, el menú y la
          lista no se envían a esos servicios. La ciudad elegida se usa solo para pedir un pronóstico
          por coordenadas de una lista fija; no usamos el GPS:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="text-fg">Open-Meteo</span>: pronóstico del clima de la ciudad que
            eliges desde una lista fija de 12 ciudades. No usamos el GPS de tu teléfono.
          </li>
          <li>
            <span className="text-fg">Nager.Date</span>: días festivos de México.
          </li>
          <li>
            <span className="text-fg">Open Prices y Open Food Facts</span> (ODbL): precios,
            productos de anaquel y etiquetas nutricionales.
          </li>
          <li>
            <span className="text-fg">TheMealDB</span>: ideas de recetas mexicanas.
          </li>
          <li>
            <span className="text-fg">Wikipedia en español</span> (CC BY-SA): descripciones de
            ingredientes.
          </li>
          <li>
            <span className="text-fg">GitHub</span>: datos públicos del repositorio de la app.
          </li>
        </ul>
        <p>
          Si usas “Explora etiquetas”, el término de producto que escribiste se envía a nuestro
          servidor y desde ahí a Open Food Facts; no escribas datos personales en ese campo. La
          búsqueda no incluye presupuesto, menú ni lista. Su respuesta se conserva solo en memoria
          del servidor hasta 30 minutos y no se persiste en la base de datos.
        </p>
        <p>
          Las APIs consultadas desde el servidor reciben su IP; al cargar una imagen o abrir un
          enlace externo, ese proveedor también puede recibir datos técnicos de tu navegador. Las
          imágenes y enlaces se limitan a dominios permitidos.
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
          <span className="text-fg">Más → Borrar el plan de este teléfono</span>. Para preguntas
          sobre privacidad, abre un issue en el repositorio público.
        </p>
      </section>
    </div>
  );
}
