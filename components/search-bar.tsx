"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Loader2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapSelector } from "./map-selector"

interface SearchBarProps {
  onSearch: (params: { location: string; date: string; coordinates: { lat: number; lng: number } }) => void
  loading?: boolean
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [location, setLocation] = useState("")
  const today = new Date().toISOString().split("T")[0]
  const [date, setDate] = useState(today)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [searchTrigger, setSearchTrigger] = useState<string>("")
  const [showCoordinateWarning, setShowCoordinateWarning] = useState(false)
  const [showDateWarning, setShowDateWarning] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!location.trim()) {
      return
    }

    if (!coordinates) {
      setShowCoordinateWarning(true)
      return
    }

    if (!date) {
      setShowDateWarning(true)
      return
    }

    setShowCoordinateWarning(false)
    setShowDateWarning(false)
    onSearch({ location: location.trim(), date, coordinates })
  }

  const handleMapLocationSelect = (locationName: string, lat: number, lng: number) => {
    setLocation(locationName)
    setCoordinates({ lat, lng })
    setShowCoordinateWarning(false)
  }

  useEffect(() => {
    if (!location) return

    const timer = setTimeout(() => {
      setSearchTrigger(location)
    }, 1000) // Esperar 1 segundo después de que el usuario deje de escribir

    return () => clearTimeout(timer)
  }, [location])

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-4 md:space-y-6">
        <div>
          <Label htmlFor="location" className="text-sm font-medium text-foreground mb-2 block">
            Location
          </Label>
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <Input
              id="location"
              type="text"
              placeholder="Insert a city or address..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 md:pl-12 h-12 md:h-14 text-base md:text-lg bg-card border-2 border-border focus:border-primary transition-colors"
              disabled={loading}
            />
          </div>
          {coordinates && (
            <p className="text-xs text-muted-foreground mt-2">
              Coordenadas: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </p>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">Select a location on the map</Label>
          <MapSelector onLocationSelect={handleMapLocationSelect} searchLocation={searchTrigger} />
          {showCoordinateWarning && (
            <p className="text-xs text-destructive mt-2">Please select a point on the map to obtain coordinates.</p>
          )}
        </div>

        <div>
          <Label htmlFor="date" className="text-sm font-medium text-foreground mb-2 block">
            Date of the pronostic
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setShowDateWarning(false)
              }}
              min={today}
              className="pl-10 md:pl-12 h-12 md:h-14 text-base md:text-lg bg-card border-2 border-border focus:border-primary transition-colors"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Select the day to analyze with the backend service.</p>
          {showDateWarning && (
            <p className="text-xs text-destructive mt-2">Please choose a date for the analysis.</p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-12 md:h-14 text-base md:text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={loading || !location.trim() || !coordinates || !date}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin" />
              Searching a forecast...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Search a forecast
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
