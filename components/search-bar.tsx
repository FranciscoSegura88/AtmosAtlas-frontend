"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Loader2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapSelector } from "./map-selector"

interface SearchBarProps {
  onSearch: (location: string, date: string) => void
  loading?: boolean
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [location, setLocation] = useState("")
  const [date, setDate] = useState("")
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [searchTrigger, setSearchTrigger] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (location.trim()) {
      onSearch(location.trim(), date)
    }
  }

  const handleMapLocationSelect = (locationName: string, lat: number, lng: number) => {
    setLocation(locationName)
    setCoordinates({ lat, lng })
  }

  useEffect(() => {
    if (!location) return

    const timer = setTimeout(() => {
      setSearchTrigger(location)
    }, 1000) // Esperar 1 segundo después de que el usuario deje de escribir

    return () => clearTimeout(timer)
  }, [location])

  const today = new Date().toISOString().split("T")[0]

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-4 md:space-y-6">
        <div>
          <Label htmlFor="location" className="text-sm font-medium text-foreground mb-2 block">
            Ubicación
          </Label>
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <Input
              id="location"
              type="text"
              placeholder="Ingresa una ciudad o selecciona en el mapa..."
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
          <Label className="text-sm font-medium text-foreground mb-2 block">Selecciona ubicación en el mapa</Label>
          <MapSelector onLocationSelect={handleMapLocationSelect} searchLocation={searchTrigger} />
        </div>

        <div>
          <Label htmlFor="date" className="text-sm font-medium text-foreground mb-2 block">
            Fecha del pronóstico (opcional)
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
          <p className="text-xs text-muted-foreground mt-2">Selecciona cualquier fecha futura para ver el pronóstico</p>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-12 md:h-14 text-base md:text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={loading || !location.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin" />
              Buscando pronóstico...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Buscar Pronóstico
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
