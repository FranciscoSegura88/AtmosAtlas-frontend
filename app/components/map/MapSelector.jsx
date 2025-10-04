import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons when using bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
});

function ClickHandler({ onSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      let displayName = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      try {
        // lightweight reverse geocode via Nominatim (no key). You can swap to Google later.
        const q = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        const res = await fetch(q, { headers: { "Accept": "application/json" }});
        if (res.ok) {
          const data = await res.json();
          displayName = data.display_name || displayName;
        }
      } catch (err) {
        // ignore network errors, fallback to lat,lng
      }
      // Notify the rest of the app without tight coupling
      document.dispatchEvent(new CustomEvent("locationSelected", { detail: { lat, lng, displayName } }));
      if (onSelect) onSelect({ lat, lng, displayName });
    }
  });
  return null;
}

export default function MapSelector({ center=[19.4326, -99.1332], zoom=12, height="350px", onSelect }) {
  return (
    <div style={{ width: "100%", height }}>
      <MapContainer center={center} zoom={zoom} style={{ width: "100%", height: "100%", borderRadius: "12px" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={onSelect} />
        <Marker position={center} />
      </MapContainer>
    </div>
  );
}