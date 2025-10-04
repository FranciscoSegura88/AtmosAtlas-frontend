Integración del mapa (sin mover nada más)

Se copiaron/crearon solo los archivos necesarios para que funcione el mapa y que, al dar clic,
se envíe la ubicación y aparezca en el buscador existente.

ARCHIVOS NUEVOS dentro de src/components/map/
  - MapSelector.jsx  (usa react-leaflet + leaflet)
  - MapView.jsx      (vista simple para probar el mapa)

PAQUETES agregados en package.json (instálalos en tu proyecto):
  - leaflet
  - react-leaflet

HOJA DE ESTILOS
  - Se añadió la importación de la hoja de estilos de Leaflet en: /mnt/data/_merge_weather_map/weather_app/app/globals.css

LISTENER INYECTADO
  - Se inyectó un listener en: src/main.jsx
    Este listener escucha el evento CustomEvent('locationSelected') que emite el Mapa,
    y coloca el nombre de la ubicación en cualquier input que tenga:
      name="search"  o  data-role="search"  o  placeholder que contenga "Busca"/"Search"

CÓMO PROBAR
  1) Instala dependencias nuevas:
     npm i leaflet react-leaflet
  2) En cualquier página, importa la vista:
     import MapView from "@/components/map/MapView";  // ajusta el alias si no usas "@"
     <MapView />
  3) Haz clic en el mapa; debería actualizar tu campo de búsqueda automáticamente.

NOTA: El componente usa Nominatim (OSM) para reverse geocoding (sin clave).
      Si prefieres Google, reemplaza el fetch dentro de MapSelector.jsx.