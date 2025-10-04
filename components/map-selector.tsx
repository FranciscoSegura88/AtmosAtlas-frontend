"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"

interface MapSelectorProps {
  onLocationSelect: (location: string, lat: number, lng: number) => void
  searchLocation?: string
}

export function MapSelector({ onLocationSelect, searchLocation }: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [L, setL] = useState<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const loadLeaflet = async () => {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)

      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.onload = () => {
        setL((window as any).L)
        setIsLoaded(true)
      }
      document.head.appendChild(script)
    }

    loadLeaflet()
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current || !L) return

    const initialMap = L.map(mapRef.current).setView([19.4326, -99.1332], 10)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(initialMap)

    mapInstanceRef.current = initialMap

    setTimeout(() => {
      setIsMapReady(true)
    }, 300)

    const createMarkerIcon = () => {
      return L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })
    }

    initialMap.on("click", async (e: any) => {
      const { lat, lng } = e.latlng

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], {
          icon: createMarkerIcon(),
        }).addTo(initialMap)
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        )
        const data = await response.json()

        if (data.display_name) {
          onLocationSelect(data.display_name, lat, lng)
        } else {
          onLocationSelect(`${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng)
        }
      } catch (error) {
        console.error("Error en geocoding:", error)
        onLocationSelect(`${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng)
      }
    })

    return () => {
      // cleanup marker and map safely and clear refs so async callbacks don't access removed instances
      if (markerRef.current) {
        try {
          markerRef.current.remove()
        } catch (e) {
          // ignore errors during cleanup
        }
        markerRef.current = null
      }

      try {
        initialMap.remove()
      } catch (e) {
        // ignore
      }

      mapInstanceRef.current = null
    }
  }, [isLoaded, L, onLocationSelect])

  useEffect(() => {
    if (!searchLocation || !L || !isMapReady) return

    let isMounted = true

    const geocodeLocation = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}&limit=1`,
        )
        const data = await response.json()

        if (data && data.length > 0) {
          const { lat, lon } = data[0]
          const latNum = Number.parseFloat(lat)
          const lonNum = Number.parseFloat(lon)

          const mapInst = mapInstanceRef.current
          if (!isMounted || !mapInst || typeof mapInst.getContainer !== "function" || !mapInst.getContainer()) {
            console.error("El mapa no está completamente inicializado o ya fue desmontado")
            return
          }

          try {
            mapInst.setView([latNum, lonNum], 12)
          } catch (err) {
            console.error("Error al mover la vista del mapa (setView):", err)
            return
          }

          try {
            if (markerRef.current) {
              markerRef.current.setLatLng([latNum, lonNum])
            } else {
              const newMarker = L.marker([latNum, lonNum], {
                icon: L.icon({
                  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                }),
              })

              if (mapInstanceRef.current && typeof mapInstanceRef.current.getContainer === "function" && mapInstanceRef.current.getContainer()) {
                try {
                  newMarker.addTo(mapInstanceRef.current)
                  markerRef.current = newMarker
                } catch (err) {
                  console.error("No se pudo añadir el marcador al mapa:", err)
                }
              }
            }
          } catch (markerError) {
            console.error("Error al crear/mover el marcador:", markerError)
          }
        }
      } catch (error) {
        console.error("Error en geocoding:", error)
      }
    }

    const timeoutId = setTimeout(() => {
      geocodeLocation()
    }, 800)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [searchLocation, L, isMapReady])

  if (!isLoaded) {
    return (
      <div className="w-full h-[250px] sm:h-[300px] md:h-[400px] bg-card rounded-xl border-2 border-border flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 md:w-12 md:h-12 text-primary mx-auto mb-2 animate-pulse" />
          <p className="text-sm md:text-base text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
        <span>Haz clic en el mapa para seleccionar una ubicación</span>
      </div>
      <div
        ref={mapRef}
        className="w-full h-[250px] sm:h-[300px] md:h-[400px] rounded-xl border-2 border-border shadow-lg"
      />
    </div>
  )
}
