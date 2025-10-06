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
    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default
      const mapInstance = L.map(mapRef.current!).setView([20, 0], 2)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(mapInstance)
      setMap(mapInstance)
      mapInstance.on("click", async (e: any) => {
        const { lat, lng } = e.latlng
        await handleLocationClick(lat, lng, L, mapInstance)
      })
    }
    loadLeaflet()
    return () => { if (map) map.remove() }
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
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lng}`)
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      // marker
      if (marker) {
        marker.setLatLng([lat, lng])
      } else {
        const newMarker = L.marker([lat, lng])
        newMarker.addTo(mapInstance)
        setMarker(newMarker)
      }
      mapInstance.setView([lat, lng], 10)

      // Build a LocationData without OpenWeather fields
      const locationData: LocationData = {
        lat,
        lng,
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      }

      onLocationSelect(locationData)
      onWeatherData(data)
    } catch (err) {
      console.error("Error fetching weather:", err)
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
            <p className="text-sm text-foreground">Fetching data...</p>
          </div>
        </div>
      )}
      <div className="absolute top-4 left-4 z-[1000] bg-card/90 backdrop-blur-xl p-4 rounded-lg border-2 border-primary shadow-2xl max-w-xs">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-1">Select a location</p>
            <p className="text-muted-foreground text-xs">Click anywhere on the map or use the search</p>
          </div>
        </div>
      </div>
    </div>
  )
}
