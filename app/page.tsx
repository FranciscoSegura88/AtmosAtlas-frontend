"use client"

import { useState } from "react"
import { SearchBar } from "@/components/search-bar"
import { WeatherDisplay } from "@/components/weather-display"
import type { WeatherData } from "@/types/weather"
import { Cloud, Sun, MapPin, TrendingUp, Calendar, Shield } from "lucide-react"
import Image from "next/image"

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async ({ location, date, coordinates }: { location: string; date: string; coordinates: { lat: number; lng: number } }) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        location,
        lat: coordinates.lat.toString(),
        lon: coordinates.lng.toString(),
      })

      if (date) {
        params.set("date", date)
      }

      const response = await fetch(`/api/weather?${params.toString()}`)
      const data = await response.json()
      setWeatherData(data)
    } catch (error) {
      console.error("[AtmosAtlas] Error fetching weather:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <Cloud className="absolute top-10 left-4 md:top-20 md:left-10 w-16 h-16 md:w-32 md:h-32 text-primary/10 animate-clouds" />
        <Sun className="absolute top-20 right-4 md:top-40 md:right-20 w-12 h-12 md:w-24 md:h-24 text-secondary/10 animate-float" />
        <Cloud
          className="absolute bottom-20 right-10 md:bottom-32 md:right-40 w-20 h-20 md:w-40 md:h-40 text-accent/10 animate-clouds"
          style={{ animationDelay: "5s" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-12">
        {/* Enhanced Header with Logo */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/atmosatlaslogo.png"
              alt="AtmosAtlas"
              width={180}
              height={60}
              className="w-32 md:w-44 lg:w-52 h-auto"
              priority
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 md:mb-4 text-balance bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Historical Climate Risk Intelligence
          </h1>
          <p className="text-base md:text-lg text-muted-foreground text-pretty px-4 max-w-3xl mx-auto">
            Not a weather forecast, it's a forecast of the past. Analyze 40+ years of NASA climate data to plan your future events with confidence.
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card/60 backdrop-blur-sm rounded-full border border-border/50">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Global Coverage</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card/60 backdrop-blur-sm rounded-full border border-border/50">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Any Future Date</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card/60 backdrop-blur-sm rounded-full border border-border/50">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">NASA Validated Data</span>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8 md:mb-16">
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl border-2 border-primary/20 shadow-2xl p-6">
            <SearchBar onSearch={handleSearch} loading={loading} />
          </div>
        </div>

        {/* Weather Results */}
        {weatherData && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WeatherDisplay data={weatherData} />
          </div>
        )}

        {/* Enhanced Initial State */}
        {!weatherData && !loading && (
          <div className="text-center py-10 md:py-20">
            <div className="inline-block p-6 md:p-8 bg-card/80 backdrop-blur-xl rounded-2xl shadow-lg border border-primary/20">
              <div className="relative">
                <Cloud className="w-16 h-16 md:w-20 md:h-20 text-primary mx-auto mb-4 animate-float" />
                <TrendingUp className="w-8 h-8 text-secondary absolute -right-2 -top-2 animate-pulse" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-2 text-foreground">
                Ready to Predict the Past?
              </h3>
              <p className="text-base md:text-lg text-muted-foreground px-4 max-w-md">
                Select any location and date to discover historical climate patterns and make data-driven decisions.
              </p>
              
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
                <div>
                  <div className="text-2xl font-bold text-primary">40+</div>
                  <div className="text-xs text-muted-foreground">Years of Data</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">99%</div>
                  <div className="text-xs text-muted-foreground">Global Coverage</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">ML</div>
                  <div className="text-xs text-muted-foreground">Powered Analysis</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span>Powered by NASA POWER & Advanced ML</span>
          </div>
          <p className="text-xs opacity-75">
            © 2025 AtmosAtlas - Democratizing climate intelligence for better decision making
          </p>
        </footer>
      </div>
    </main>
  )
}