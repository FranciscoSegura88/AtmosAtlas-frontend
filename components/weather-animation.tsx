"use client"

import { Cloud, CloudRain, Sun, Droplets, Wind } from "lucide-react"

interface WeatherAnimationProps {
  condition: string
  humidity: number
}

export function WeatherAnimation({ condition, humidity }: WeatherAnimationProps) {
  const getAnimation = () => {
    const lowerCondition = condition.toLowerCase()

    // Lluvia
    if (lowerCondition.includes("rain") || lowerCondition.includes("drizzle")) {
      return (
        <div className="relative w-48 h-48">
          <CloudRain className="w-48 h-48 text-primary animate-float" />
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-8 bg-primary/60 rounded-full animate-rain"
              style={{
                left: `${20 + i * 15}%`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      )
    }

    // Nublado o húmedo
    if (lowerCondition.includes("cloud") || humidity > 70) {
      return (
        <div className="relative w-48 h-48">
          <Cloud className="w-48 h-48 text-primary animate-float" />
          {humidity > 70 && (
            <Droplets className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 text-accent animate-humidity" />
          )}
        </div>
      )
    }

    // Soleado o despejado
    if (lowerCondition.includes("clear") || lowerCondition.includes("sun")) {
      return (
        <div className="relative w-48 h-48">
          <Sun className="w-48 h-48 text-secondary animate-sunny" />
          <div className="absolute inset-0 bg-secondary/20 rounded-full blur-2xl animate-pulse" />
        </div>
      )
    }

    // Seco (baja humedad)
    if (humidity < 30) {
      return (
        <div className="relative w-48 h-48">
          <Sun className="w-48 h-48 text-secondary animate-sunny" />
          <Wind className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 text-muted-foreground animate-dry" />
        </div>
      )
    }

    // Por defecto - nublado
    return (
      <div className="relative w-48 h-48">
        <Cloud className="w-48 h-48 text-primary animate-float" />
      </div>
    )
  }

  return <div className="flex items-center justify-center p-8">{getAnimation()}</div>
}
