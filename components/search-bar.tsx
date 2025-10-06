"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Search, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapSelector } from "./map-selector"

/** Matches "lat, lon" or "lat lon" (degrees with optional decimals) */
const LATLON_RE = /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/

interface SearchBarProps {
  onSearch: (params: { location: string; date: string; coordinates: { lat: number; lng: number } }) => void
  loading?: boolean
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [location, setLocation] = useState("")
  const [date, setDate] = useState("")
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [searchTrigger, setSearchTrigger] = useState<string>("")
  const [showCoordinateWarning, setShowCoordinateWarning] = useState(false)

  // --- Submit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!location.trim()) return

    if (!coordinates) {
      setShowCoordinateWarning(true)
      return
    }

    setShowCoordinateWarning(false)
    onSearch({ location: location.trim(), date, coordinates })
  }

  // --- Map -> Input binding ---
  const handleMapLocationSelect = (locationName: string, lat: number, lng: number) => {
    setLocation(locationName)
    setCoordinates({ lat, lng })
    setShowCoordinateWarning(false)
  }

  // --- Listen to CustomEvent('locationSelected') for compatibility with react-leaflet MapSelector.jsx ---
  useEffect(() => {
    const onEvt = (evt: Event) => {
      const detail = (evt as CustomEvent).detail || {}
      const lat = Number(detail.lat)
      const lng = Number(detail.lng)
      const name: string =
        typeof detail.displayName === "string" && detail.displayName.trim()
          ? detail.displayName
          : `${isFinite(lat) ? lat.toFixed(4) : "—"}, ${isFinite(lng) ? lng.toFixed(4) : "—"}`
      if (isFinite(lat) && isFinite(lng)) {
        handleMapLocationSelect(name, lat, lng)
      }
    }
    document.addEventListener("locationSelected" as any, onEvt)
    return () => document.removeEventListener("locationSelected" as any, onEvt)
  }, [])

  // --- When typing in the input, try to parse "lat, lon"; also debounce forward geocode trigger ---
  useEffect(() => {
    const text = location.trim()
    // If user typed coordinates, set them immediately
    const m = text.match(LATLON_RE)
    if (m) {
      const lat = Number(m[1])
      const lng = Number(m[2])
      if (isFinite(lat) && isFinite(lng)) {
        setCoordinates({ lat, lng })
        setShowCoordinateWarning(false)
      }
    }

    const t = setTimeout(() => setSearchTrigger(text), 600) // debounce 600ms
    return () => clearTimeout(t)
  }, [location])

  const today = useMemo(() => new Date().toISOString().split("T")[0], [])

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-4 md:space-y-6">
        {/* Location input */}
        <div>
          <Label htmlFor="location" className="text-sm font-medium text-foreground mb-2 block">
            Location
          </Label>
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <Input
              id="location"
              type="text"
              placeholder="Type a city, address or “lat, lon”..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 md:pl-12 h-12 md:h-14 text-base md:text-lg bg-card border-2 border-border focus:border-primary transition-colors"
              disabled={loading}
              autoComplete="off"
            />
          </div>
          {coordinates && (
            <p className="text-xs text-muted-foreground mt-2">
              Coordinates: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </p>
          )}
        </div>

        {/* Map */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">Select a location on the map</Label>
          <MapSelector onLocationSelect={handleMapLocationSelect} searchLocation={searchTrigger} />
          {showCoordinateWarning && (
            <p className="text-xs text-destructive mt-2">Please select a point on the map to obtain coordinates.</p>
          )}
        </div>

        {/* Date */}
        <div>
          <Label htmlFor="date" className="text-sm font-medium text-foreground mb-2 block">
            Forecast date (optional)
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="pl-10 md:pl-12 h-12 md:h-14 text-base md:text-lg bg-card border-2 border-border focus:border-primary transition-colors"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Select any future date to see the projection</p>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-12 md:h-14 text-base md:text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={loading}
        >
          {loading ? "Loading..." : "Search a forecast"}
        </Button>
      </div>
    </form>
  )
}
