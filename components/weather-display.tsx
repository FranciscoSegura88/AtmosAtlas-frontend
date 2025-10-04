"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WeatherAnimation } from "@/components/weather-animation"
import { Droplets, Wind, Eye, Gauge, Download, Calendar } from "lucide-react"

interface WeatherDisplayProps {
  data: {
    location: string
    temperature: number
    condition: string
    humidity: number
    windSpeed: number
    visibility: number
    pressure: number
    description: string
    date?: string
  }
}

export function WeatherDisplay({ data }: WeatherDisplayProps) {
  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `clima-${data.location.replace(/[^a-z0-9]/gi, "-")}-${data.date || "actual"}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownloadText = () => {
    const textContent = `
PRONÓSTICO DEL CLIMA
====================

Ubicación: ${data.location}
${data.date ? `Fecha: ${new Date(data.date).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}` : "Fecha: Actual"}

Temperatura: ${Math.round(data.temperature)}°C
Condición: ${data.description}

DETALLES
--------
Humedad: ${data.humidity}%
Velocidad del viento: ${data.windSpeed} km/h
Visibilidad: ${data.visibility} km
Presión atmosférica: ${data.pressure} hPa

Generado el: ${new Date().toLocaleString("es-ES")}
    `.trim()

    const dataBlob = new Blob([textContent], { type: "text/plain" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `clima-${data.location.replace(/[^a-z0-9]/gi, "-")}-${data.date || "actual"}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Tarjeta principal */}
      <Card className="p-4 md:p-8 bg-card/80 backdrop-blur-sm border-2">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          {/* Información principal */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">{data.location}</h2>
            {data.date && (
              <div className="flex items-center gap-2 text-muted-foreground mb-2 justify-center md:justify-start">
                <Calendar className="w-4 h-4" />
                <span className="text-xs sm:text-sm">
                  {new Date(data.date).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 capitalize">{data.description}</p>
            <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-primary">
              {Math.round(data.temperature)}°C
            </div>
          </div>

          {/* Animación del clima */}
          <div className="flex-1 flex justify-center">
            <WeatherAnimation condition={data.condition} humidity={data.humidity} />
          </div>
        </div>
      </Card>

      {/* Detalles adicionales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-sm border-2 hover:border-primary transition-colors">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Droplets className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-xs md:text-sm text-muted-foreground">Humedad</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-foreground">{data.humidity}%</div>
        </Card>

        <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-sm border-2 hover:border-primary transition-colors">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Wind className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-xs md:text-sm text-muted-foreground">Viento</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-foreground">{data.windSpeed} km/h</div>
        </Card>

        <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-sm border-2 hover:border-primary transition-colors">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Eye className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-xs md:text-sm text-muted-foreground">Visibilidad</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-foreground">{data.visibility} km</div>
        </Card>

        <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-sm border-2 hover:border-primary transition-colors">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Gauge className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-xs md:text-sm text-muted-foreground">Presión</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-foreground">{data.pressure} hPa</div>
        </Card>
      </div>

      {/* Descargar información */}
      <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-sm border-2">
        <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Descargar información</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDownloadText}
            variant="outline"
            className="flex-1 h-11 md:h-12 border-2 bg-transparent text-sm md:text-base"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar como Texto
          </Button>
          <Button
            onClick={handleDownloadJSON}
            variant="outline"
            className="flex-1 h-11 md:h-12 border-2 bg-transparent text-sm md:text-base"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar como JSON
          </Button>
        </div>
      </Card>
    </div>
  )
}
