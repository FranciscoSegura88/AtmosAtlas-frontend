Map integration (no other files moved)

Only the files required to make the map work were copied/created. Clicking the map
sends the location and populates the existing search input.

NEW FILES under src/components/map/
  - MapSelector.jsx  (uses react-leaflet + leaflet)
  - MapView.jsx      (simple view to test the map)

PACKAGES added to package.json (install them in your project):
  - leaflet
  - react-leaflet

STYLESHEET
  - The Leaflet stylesheet import was added in: /mnt/data/_merge_weather_map/weather_app/app/globals.css

INJECTED LISTENER
  - A listener was injected in: src/main.jsx
    This listener listens for the CustomEvent('locationSelected') emitted by the map,
    and sets the location name into any input that matches:
      name="search"  or  data-role="search"  or  placeholder that contains "Search"

HOW TO TEST
  1) Install new dependencies:
     npm i leaflet react-leaflet
  2) On any page, import the view:
     import MapView from "@/components/map/MapView";  // adjust alias if you don't use "@"
     <MapView />
  3) Click on the map; it should update your search input automatically.

NOTE: The component uses Nominatim (OSM) for reverse geocoding (no key required).
      If you prefer Google, replace the fetch inside MapSelector.jsx.