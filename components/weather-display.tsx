"use client"

import { Card } from "@/components/ui/card"
import { WeatherAnimation } from "@/components/weather-animation"
import { BackendForecastInsights } from "@/components/backend-forecast-insights"
import { ReportDownload } from "@/components/ReportDownload"
import type { WeatherData } from "@/types/weather"
import { Droplets, Wind, Eye, Gauge, Thermometer } from "lucide-react"
import { fmtDateLocalYMD, fmtMaybe } from "@/lib/format"

interface WeatherDisplayProps {
  data: WeatherData
}

export function WeatherDisplay({ data }: WeatherDisplayProps) {
  const sum = data?.backendSummary
  const rich = data?.backendSummaryRich
  const finalWeighted = Number(rich?.probabilities?.final_weighted)
  const finalConfidence = String(rich?.probabilities?.final_confidence ?? "")

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Weather Forecast</h2>
          <p className="text-sm text-muted-foreground">
            {data?.location ?? "—"} • {fmtDateLocalYMD(data?.date)}
          </p>
        </div>
        <ReportDownload data={data} />
      </div>

      {/* Hero : animation + main metrics */}
      <Card className="p-6">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="flex justify-center">
            <WeatherAnimation condition={data?.condition} humidity={data?.humidity} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">Temperature</div>
              <div className="text-3xl font-semibold flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-primary" />
                {fmtMaybe(data?.temperature, "°C", 0)}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">Humidity</div>
              <div className="text-3xl font-semibold flex items-center gap-2">
                <Droplets className="w-5 h-5 text-primary" />
                {fmtMaybe(data?.humidity, "%", 0)}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">Wind</div>
              <div className="text-3xl font-semibold flex items-center gap-2">
                <Wind className="w-5 h-5 text-primary" />
                {fmtMaybe(data?.windSpeed, "km/h", 0)}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">Pressure</div>
              <div className="text-3xl font-semibold flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                {fmtMaybe(data?.pressure, "hPa", 0)}
              </div>
            </div>

            {/* Visibility only if present */}
            {Number.isFinite(Number(data?.visibility)) && (
              <div className="rounded-lg border p-4 col-span-2">
                <div className="text-xs text-muted-foreground">Visibility</div>
                <div className="text-xl font-semibold flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  {fmtMaybe(data?.visibility, "km", 0)}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ML insights */}
      {sum && (
        <BackendForecastInsights
          summary={sum}
          riskScores={data?.riskScores}
          finalWeighted={Number.isFinite(finalWeighted) ? finalWeighted : undefined}
          finalConfidence={finalConfidence || undefined}
        />
      )}
    </div>
  )
}
