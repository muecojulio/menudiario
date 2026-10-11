# Menú Diario

App instalable para armar desayuno, comida y cena con un presupuesto en pesos y la lista de compra para supermercados de México.

La comida incluye postre y bebida (agua de sabor o refresco). Las cantidades cubren los días y las personas que elijas. El presupuesto y el plan se quedan en el teléfono.

## Pestañas

- **Plan**: presupuesto, días, personas, comidas, bebida, supermercado y ciudad para el clima.
- **Menú**: resumen del presupuesto, días con clima y festivos, sugerencias según el tiempo, comidas en carrusel e ideas mexicanas.
- **Lista**: compras agrupadas por pasillo, con progreso, copia de la lista y fichas de ingredientes. Desliza una fila (o usa ⋯) para ver sus acciones.
- **QR**: código para abrir la app desde cualquier dispositivo, con descarga PNG/SVG, compartir y copiar enlace.
- **Privacidad**: qué se guarda, qué se consulta y qué no hace la app.
- **Más**: instalación, repositorio público, fuentes y licencias, y borrado del plan.

Se puede cambiar de pestaña tocando, con el mouse, con el teclado (flechas, Inicio y Fin) o deslizando horizontalmente.

## APIs públicas

Todas se consultan desde el servidor, sin clave ni registro. Las consultas solo llevan datos generales (nunca nombre, presupuesto ni ubicación) y la ciudad sale de una lista fija.

| Fuente                                             | Uso                                 | Licencia                    |
| -------------------------------------------------- | ----------------------------------- | --------------------------- |
| [Open-Meteo](https://open-meteo.com)               | Pronóstico de 14 días por ciudad    | Uso no comercial, CC BY 4.0 |
| [Nager.Date](https://date.nager.at)                | Días festivos de México             | MIT                         |
| [Open Prices](https://prices.openfoodfacts.org)    | Precios vistos en anaquel           | AGPL-3.0 (datos ODbL)       |
| [Open Food Facts](https://world.openfoodfacts.org) | Conteo de productos por ingrediente | ODbL                        |
| [TheMealDB](https://www.themealdb.com)             | Ideas y recetas mexicanas           | Ver sitio                   |
| [Wikipedia en español](https://es.wikipedia.org)   | Descripción de ingredientes         | CC BY-SA 4.0                |
| [GitHub REST](https://docs.github.com/rest)        | Datos públicos de este repositorio  | Ver sitio                   |

Las respuestas se validan con zod, tienen tiempo y tamaño máximos, y se guardan en caché: memoria del proceso y la tabla `price_cache` (con índices por clave y por fecha; ver `migrations/0002_market.sql`).

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
