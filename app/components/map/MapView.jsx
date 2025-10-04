import MapSelector from "./MapSelector";

export default function MapView() {
  return (
    <div className="p-4">
  <h2 style={{marginBottom: '8px'}}>Map</h2>
      <MapSelector />
      <p style={{marginTop: '8px', fontSize: '0.9rem'}}>
        Click on the map to select a location. The name will appear in your search field automatically.
      </p>
    </div>
  );
}