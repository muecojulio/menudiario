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
        publicidad. Tu presupuesto, las personas en casa, tu ciudad y la lista de compras se quedan
        en este teléfono.
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
          El servidor de la app consulta fuentes públicas, sin clave ni registro. Las consultas solo
          llevan datos generales, nunca tu nombre, tu presupuesto ni tu ubicación:
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
            <span className="text-fg">Open Prices y Open Food Facts</span> (ODbL): precios y
            productos de anaquel.
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
          Como cualquier servicio en internet, cada proveedor puede ver la dirección IP del servidor
          que hace la consulta, no la tuya. Las imágenes y enlaces externos solo se aceptan desde
          dominios permitidos.
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
