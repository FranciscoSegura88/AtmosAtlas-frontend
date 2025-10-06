// components/weather-animation.tsx
"use client"

import { Cloud, CloudRain, Sun, Droplets, Wind } from "lucide-react"

interface WeatherAnimationProps {
  condition?: string | null
  humidity?: number | null
}

export function WeatherAnimation({ condition, humidity }: WeatherAnimationProps) {
  const lower = String(condition ?? "").toLowerCase().trim()
  const hRaw = Number(humidity)
  const h = Number.isFinite(hRaw) ? Math.min(100, Math.max(0, hRaw)) : 0

  const render = () => {
    if (lower.includes("rain") || lower.includes("drizzle")) {
      return (
        <div className="relative w-48 h-48">
          <CloudRain className="w-48 h-48 text-primary animate-float" />
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-8 bg-primary/60 rounded-full animate-rain"
              style={{ left: `${20 + i * 15}%`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )
    }

    if (lower.includes("cloud") || h > 70) {
      return (
        <div className="relative w-48 h-48">
          <Cloud className="w-48 h-48 text-primary animate-float" />
          {h > 70 && (
            <Droplets className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 text-accent animate-humidity" />
          )}
        </div>
      )
    }

    if (lower.includes("clear") || lower.includes("sun")) {
      return (
        <div className="relative w-48 h-48">
          <Sun className="w-48 h-48 text-secondary animate-sunny" />
          <div className="absolute inset-0 bg-secondary/20 rounded-full blur-2xl animate-pulse" />
        </div>
      )
    }

    if (h < 30) {
      return (
        <div className="relative w-48 h-48">
          <Sun className="w-48 h-48 text-secondary animate-sunny" />
          <Wind className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 text-muted-foreground animate-dry" />
        </div>
      )
    }

    return (
      <div className="relative w-48 h-48">
        <Cloud className="w-48 h-48 text-primary animate-float" />
      </div>
    )
  }

  return <div className="flex items-center justify-center p-8">{render()}</div>
}
