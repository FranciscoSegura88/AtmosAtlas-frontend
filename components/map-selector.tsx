"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"

interface MapSelectorProps {
  onLocationSelect: (locationName: string, lat: number, lng: number) => void
  /** Free text coming from the search input */
  searchLocation?: string
}

/**
 * Leaflet-only map selector with solid two-way binding:
 * - Forward geocode (searchLocation) -> center map, upsert marker, call onLocationSelect
 * - Reverse geocode (click on map)   -> upsert marker, update input via onLocationSelect
 * - Also broadcasts CustomEvent('locationSelected') for compatibility with the react-leaflet variant.
 */
export function MapSelector({ onLocationSelect, searchLocation }: MapSelectorProps) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [L, setL] = useState<any>(null)

  // --- bootstrap Leaflet (dynamic import = SSR-safe) ---
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const Leaflet = (await import("leaflet")).default
      if (cancelled) return
      setL(Leaflet)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // --- init map once ---
  useEffect(() => {
    if (!L || !mapElRef.current || mapRef.current) return

    // Create map
    const map = L.map(mapElRef.current).setView([19.4326, -99.1332], 10)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map

    // Handle clicks (reverse geocode)
    const onClick = async (e: any) => {
      const { lat, lng } = e.latlng
      upsertMarker(lat, lng)
      const displayName = await reverseGeocode(lat, lng)
      const name = displayName ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      // Update parent (fills the search input and stores coords)
      onLocationSelect(name, lat, lng)
      // Broadcast for compatibility with react-leaflet MapSelector.jsx
      document.dispatchEvent(new CustomEvent("locationSelected", { detail: { lat, lng, displayName: name } }))
    }

    map.on("click", onClick)

    return () => {
      try {
        map.off("click", onClick)
        map.remove()
      } catch {
        /* ignore */
      }
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L])

  // --- forward geocode when searchLocation changes ---
  useEffect(() => {
    const q = (searchLocation ?? "").trim()
    if (!L || !mapRef.current || !q) return

    const controller = new AbortController()
    ;(async () => {
      const fwd = await forwardGeocode(q, controller.signal)
      if (!fwd) return
      const { lat, lon, displayName } = fwd
      try {
        mapRef.current.setView([lat, lon], 12)
        upsertMarker(lat, lon)
        // Push normalized address + coords to parent immediately
        onLocationSelect(displayName ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon)
        // Also broadcast for compatibility
        document.dispatchEvent(new CustomEvent("locationSelected", { detail: { lat, lng: lon, displayName } }))
      } catch {
        // map was removed
      }
    })()

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLocation, L])

  // --- helpers ---
  const upsertMarker = (lat: number, lng: number) => {
    if (!L || !mapRef.current) return
    const icon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      markerRef.current = L.marker([lat, lng], { icon }).addTo(mapRef.current)
    }
  }

  async function forwardGeocode(query: string, signal?: AbortSignal) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        query,
      )}&limit=1&addressdetails=1`
      const res = await fetch(url, {
        signal,
        headers: { Accept: "application/json", "Accept-Language": "en" },
      })
      if (!res.ok) return null
      const arr = (await res.json()) as Array<any>
      if (!Array.isArray(arr) || arr.length === 0) return null
      const { lat, lon, display_name } = arr[0]
      return { lat: Number(lat), lon: Number(lon), displayName: String(display_name || "") }
    } catch {
      return null
    }
  }

  async function reverseGeocode(lat: number, lon: number) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      const res = await fetch(url, { headers: { Accept: "application/json", "Accept-Language": "en" } })
      if (!res.ok) return undefined
      const data = await res.json()
      return (data?.display_name as string) || undefined
    } catch {
      return undefined
    }
  }

  // --- UI shell ---
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
        <span>Click on the map to select a location</span>
      </div>
      <div ref={mapElRef} className="w-full h-[250px] sm:h-[300px] md:h-[400px] rounded-xl border-2 border-border shadow-lg" />
    </div>
  )
}

export default MapSelector
