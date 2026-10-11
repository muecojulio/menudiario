# Menú Diario

App instalable para armar desayuno, comida y cena con un presupuesto en pesos y la lista de compra para supermercados de México.

La comida incluye postre y bebida (agua de sabor o refresco). Las cantidades cubren los días y las personas que elijas. El presupuesto y el plan se quedan en el teléfono.

## Pestañas

- **Plan**: presupuesto, días, personas, comidas, bebida, supermercado, ciudad para el clima y búsqueda de etiquetas de productos.
- **Menú**: resumen del presupuesto, días con clima y festivos, sugerencias según el tiempo, comidas en carrusel e ideas mexicanas.
- **Lista**: compras agrupadas por pasillo, con progreso, copia de la lista y fichas de ingredientes. Desliza una fila (o usa ⋯) para ver sus acciones.
- **QR**: código para abrir la app desde cualquier dispositivo, con descarga PNG/SVG, compartir, copiar enlace y borrar el plan guardado.
- **Privacidad**: qué se guarda, qué se consulta, fuentes y licencias, y qué no hace la app.

Se puede cambiar de pestaña tocando, con el mouse, con el teclado (flechas, Inicio y Fin) o deslizando horizontalmente.

## APIs públicas

Todas se consultan desde el servidor, sin clave ni registro. El presupuesto, el menú y la lista no se envían a las fuentes. La ciudad del clima se elige de una lista fija, sin usar GPS; la búsqueda de etiquetas solo envía a Open Food Facts el término que escribes. No incluyas datos personales en esa búsqueda.

| Fuente                                             | Uso                                                             | Licencia                    |
| -------------------------------------------------- | --------------------------------------------------------------- | --------------------------- |
| [Open-Meteo](https://open-meteo.com)               | Pronóstico de 14 días por ciudad                                | Uso no comercial, CC BY 4.0 |
| [Nager.Date](https://date.nager.at)                | Días festivos de México                                         | MIT                         |
| [Open Prices](https://prices.openfoodfacts.org)    | Precios vistos en anaquel                                       | AGPL-3.0 (datos ODbL)       |
| [Open Food Facts](https://world.openfoodfacts.org) | Productos, etiquetas y búsqueda iniciada por la persona usuaria | ODbL                        |
| [TheMealDB](https://www.themealdb.com)             | Ideas y recetas mexicanas                                       | Ver sitio                   |
| [Wikipedia en español](https://es.wikipedia.org)   | Descripción de ingredientes                                     | CC BY-SA 4.0                |

Las respuestas públicas se validan, tienen límites de tiempo y tamaño, y se guardan en caché: hasta seis horas como datos recientes y, si una fuente falla, se puede usar una copia de hasta siete días. Se comparte entre memoria y la tabla `price_cache`; se conservan los índices por clave y fecha, ya que este último acelera la purga periódica de filas vencidas. Las búsquedas de Open Food Facts se limitan y deduplican en el servidor, quedan solo en memoria hasta 30 minutos y no se guardan en la base de datos.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:8080
npm run typecheck
npm run lint
npm test
npm run build
```

`npm test` ejecuta las pruebas de `src/lib` y las de `scripts/`. Algunas pruebas de `scripts/` dependen de archivos de la plataforma (`.grok/skills`) que no vienen en el repositorio.

Variables opcionales:

- `VITE_PUBLIC_APP_URL`: dirección pública (https) que codifica el código QR. Si no se define, se usa el origen actual.

## Seguridad

Ver [SECURITY.md](SECURITY.md). El repositorio incluye Dependabot, CodeQL y una auditoría de dependencias de producción en GitHub Actions.
