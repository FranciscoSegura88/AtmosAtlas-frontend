"use client"

import { useState } from "react"
import { SearchBar } from "@/components/search-bar"
import { WeatherDisplay } from "@/components/weather-display"
import type { WeatherData } from "@/types/weather"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Cloud, Sun } from "lucide-react"

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async ({ location, date, coordinates }: { location: string; date: string; coordinates: { lat: number; lng: number } }) => {
    setLoading(true)
    setError(null)
    try {
      const analyzeUrl = new URL(
        process.env.NEXT_PUBLIC_BACKEND_ANALYZE_URL ?? "http://127.0.0.1:8000/analyze",
      )
      analyzeUrl.searchParams.set("lat", coordinates.lat.toString())
      analyzeUrl.searchParams.set("lon", coordinates.lng.toString())
      analyzeUrl.searchParams.set("target_date", date)

      const response = await fetch(analyzeUrl.toString(), {
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Analyze endpoint returned ${response.status}`)
      }

      const data = (await response.json()) as WeatherData
      setWeatherData({ ...data, locationLabel: location })
    } catch (error) {
      console.error("[v0] Error fetching weather:", error)
      setWeatherData(null)
      setError("No se pudo obtener la predicción desde el backend. Intenta de nuevo más tarde.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Elementos decorativos de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <Cloud className="absolute top-10 left-4 md:top-20 md:left-10 w-16 h-16 md:w-32 md:h-32 text-primary/10 animate-clouds" />
        <Sun className="absolute top-20 right-4 md:top-40 md:right-20 w-12 h-12 md:w-24 md:h-24 text-secondary/10 animate-float" />
        <Cloud
          className="absolute bottom-20 right-10 md:bottom-32 md:right-40 w-20 h-20 md:w-40 md:h-40 text-accent/10 animate-clouds"
          style={{ animationDelay: "5s" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 md:mb-4 text-balance">
            Weather Forecast
          </h1>
          <p className="text-base md:text-lg text-muted-foreground text-pretty px-4">
            Discover the weather for any location in the world, today or in the future
          </p>
        </div>

        {/* Buscador */}
        <div className="max-w-2xl mx-auto mb-8 md:mb-16">
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No pudimos obtener la predicción</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Resultados del clima */}
        {weatherData && (
          <div className="max-w-4xl mx-auto">
            <WeatherDisplay data={weatherData} />
          </div>
        )}

        {/* Estado inicial */}
        {!weatherData && !loading && (
          <div className="text-center py-10 md:py-20">
            <div className="inline-block p-6 md:p-8 bg-card rounded-2xl shadow-lg">
              <Cloud className="w-16 h-16 md:w-20 md:h-20 text-primary mx-auto mb-4 animate-float" />
              <p className="text-lg md:text-xl text-muted-foreground px-4">
                Search for a location to see the forecast
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
