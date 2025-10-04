"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Loader2 } from "lucide-react"
import type { LocationData, WeatherData } from "@/types/weather"

interface InteractiveMapProps {
  onLocationSelect: (location: LocationData) => void
  onWeatherData: (data: WeatherData) => void
  centerLocation?: { lat: number; lon: number } | null
}

export function InteractiveMap({ onLocationSelect, onWeatherData, centerLocation }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Cargar Leaflet dinámicamente
    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default

      // Crear el mapa
      const mapInstance = L.map(mapRef.current!).setView([20, 0], 2)

      // Agregar tiles del mapa
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(mapInstance)

      setMap(mapInstance)

      // Evento de click en el mapa
      mapInstance.on("click", async (e: any) => {
        const { lat, lng } = e.latlng
        await handleLocationClick(lat, lng, L, mapInstance)
      })
    }

    loadLeaflet()

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [])

  useEffect(() => {
    if (centerLocation && map) {
      const L = (window as any).L
      handleLocationClick(centerLocation.lat, centerLocation.lon, L, map)
    }
  }, [centerLocation, map])

  const handleLocationClick = async (lat: number, lng: number, L: any, mapInstance: any) => {
    setLoading(true)

    try {
      // Obtener datos del clima
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lng}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Crear o actualizar marcador
      if (marker) {
        marker.setLatLng([lat, lng])
      } else {
        const newMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: "custom-marker",
            html: `<div class="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          }),
        }).addTo(mapInstance)
        setMarker(newMarker)
      }

      // Centrar el mapa en la ubicación
      mapInstance.setView([lat, lng], 10)

      // Crear objeto de ubicación
      const locationData: LocationData = {
        lat,
        lng,
        name: data.name,
        country: data.sys.country,
        timezone: data.timezone,
      }

      onLocationSelect(locationData)
      onWeatherData(data)
    } catch (error) {
      console.error("Error fetching weather:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-card/90 backdrop-blur-xl p-6 rounded-lg border-2 border-primary shadow-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-foreground">Obteniendo datos...</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-[1000] bg-card/90 backdrop-blur-xl p-4 rounded-lg border-2 border-primary shadow-2xl max-w-xs">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-1">Selecciona una ubicación</p>
            <p className="text-muted-foreground text-xs">Haz clic en cualquier punto del mapa o usa el buscador</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        
        .leaflet-container {
          background: rgba(0, 0, 0, 0.3);
        }
        
        .custom-marker {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  )
}
