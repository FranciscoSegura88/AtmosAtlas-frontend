import MapSelector from "./MapSelector";

export default function MapView() {
  return (
    <div className="p-4">
      <h2 style={{marginBottom: '8px'}}>Mapa</h2>
      <MapSelector />
      <p style={{marginTop: '8px', fontSize: '0.9rem'}}>
        Da clic en el mapa para seleccionar una ubicación. El nombre aparecerá en tu buscador automáticamente.
      </p>
    </div>
  );
}