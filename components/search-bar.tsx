"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Search, Calendar, MapPin, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapSelector } from "./map-selector"

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

  const handleMapLocationSelect = (locationName: string, lat: number, lng: number) => {
    setLocation(locationName)
    setCoordinates({ lat, lng })
    setShowCoordinateWarning(false)
  }

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

  useEffect(() => {
    const text = location.trim()
    const m = text.match(LATLON_RE)
    if (m) {
      const lat = Number(m[1])
      const lng = Number(m[2])
      if (isFinite(lat) && isFinite(lng)) {
        setCoordinates({ lat, lng })
        setShowCoordinateWarning(false)
      }
    }
    const t = setTimeout(() => setSearchTrigger(text), 600)
    return () => clearTimeout(t)
  }, [location])

  const today = useMemo(() => new Date().toISOString().split("T")[0], [])

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-4 md:space-y-6">
        {/* Location input with enhanced styling */}
        <div>
          <Label htmlFor="location" className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Location Analysis
          </Label>
          <div className="relative group">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="location"
              type="text"
              placeholder="Type a city, address or coordinates..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 md:pl-12 h-12 md:h-14 text-base md:text-lg bg-card/50 border-2 border-border hover:border-primary/50 focus:border-primary transition-all"
              disabled={loading}
              autoComplete="off"
            />
          </div>
          {coordinates && (
            <p className="text-xs text-primary/80 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Coordinates: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </p>
          )}
        </div>

        {/* Enhanced Map */}
        <div>
          <Label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Select Location on Interactive Map
          </Label>
          <div className="rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 transition-colors">
            <MapSelector onLocationSelect={handleMapLocationSelect} searchLocation={searchTrigger} />
          </div>
          {showCoordinateWarning && (
            <p className="text-xs text-destructive mt-2 flex items-center gap-1">
              <span className="w-1 h-1 bg-destructive rounded-full animate-pulse" />
              Please select a point on the map to obtain coordinates
            </p>
          )}
        </div>

        {/* Enhanced Date selector */}
        <div>
          <Label htmlFor="date" className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Target Date (Future Planning)
          </Label>
          <div className="relative group">
            <Calendar className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="pl-10 md:pl-12 h-12 md:h-14 text-base md:text-lg bg-card/50 border-2 border-border hover:border-primary/50 focus:border-primary transition-all"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Select any future date to analyze historical patterns for that day
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-12 md:h-14 text-base md:text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              Analyzing Historical Data...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Analyze Climate Risk
            </>
          )}
        </Button>
      </div>
    </form>
  )
}