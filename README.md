# Menú Diario

App instalable para armar desayuno, comida y cena con un presupuesto en pesos y una lista de compra para supermercados de México. Las cantidades se calculan para los días y las personas que elijas; las preferencias, el menú y la lista permanecen en el almacenamiento local del dispositivo.

## Datos y servicios públicos

Menú Diario utiliza servicios que no requieren una clave privada ni crear una cuenta:

- [Open Prices](https://prices.openfoodfacts.org) para referencias comunitarias de precios en MXN.
- [TheMealDB](https://www.themealdb.com) para mostrar ideas de recetas mexicanas e imágenes de referencia. Se usa su identificador público de prueba `1`, sin registro ni clave privada personal.
- [Open Food Facts](https://world.openfoodfacts.org) para buscar fichas de productos y datos de etiquetas cuando la persona usuaria inicia una búsqueda. Los datos alimentarios están sujetos a la licencia ODbL.

Los resultados públicos se validan y limitan en el servidor. Las referencias recientes de precios y recetas se guardan seis horas; si un proveedor no responde, se puede usar una copia pública de hasta siete días. Las búsquedas de Open Food Facts se mantienen en memoria hasta treinta minutos, sin persistir términos en la base de datos.

## Caché y base de datos

La única tabla de la app es `price_cache`, que almacena respuestas públicas, nunca preferencias o menús personales. Sus lecturas localizan la fila por `cache_key`, que ya cuenta con índice primario. La migración `0003_drop_unused_price_index.sql` elimina el índice secundario de `fetched_at`: la fecha se consulta después de obtener una sola fila por clave, así que ese índice no ayudaba a las consultas y sí agregaba costo de escritura.

## Compartir y código abierto

La pestaña **QR** genera el enlace de la app en el dispositivo y permite descargarlo como PNG o SVG, sin enviar el enlace a un servicio generador. El componente de QR usa [qrcode.react](https://github.com/zpao/qrcode.react), una biblioteca pública de GitHub con licencia ISC.

Consulta la pestaña **Privacidad** para conocer el almacenamiento local, las consultas a terceros y las opciones para borrar los datos del dispositivo.
