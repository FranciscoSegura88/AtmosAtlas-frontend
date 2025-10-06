"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackendForecastInsights } from "@/components/backend-forecast-insights"
import type { WeatherData } from "@/types/weather"
import { Activity, Calendar, Download, Droplets, Gauge, MapPin } from "lucide-react"

interface WeatherDisplayProps {
  data: WeatherData
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
})

export function WeatherDisplay({ data }: WeatherDisplayProps) {
  const coordinateLabel = `${data.location.lat.toFixed(2)}, ${data.location.lon.toFixed(2)}`
  const displayName = data.locationLabel ?? coordinateLabel
  const formattedDate = new Date(data.prediction_for).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const precipitation = data.ml_precipitation_mm
  const rainProbability = data.ml_rain_probability

  const baseFileSlug = `${data.prediction_for}-${displayName}`
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `analyze-${baseFileSlug || "forecast"}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatModelBreakdown = (records: Record<string, number>, unit: string) =>
    Object.entries(records)
      .map(([model, value]) => `${model.toUpperCase()}: ${numberFormatter.format(value)}${unit}`)
      .join("\n")

  const handleDownloadText = () => {
    const precipitationBreakdown = formatModelBreakdown(precipitation.individual_predictions_mm, " mm")
    const probabilityBreakdown = formatModelBreakdown(rainProbability.individual_probabilities, "")
    const regressionWeights = formatModelBreakdown(precipitation.ensemble_weights_reg, "")
    const classificationWeights = formatModelBreakdown(rainProbability.ensemble_weights_cls, "")

    const textContent = `
ANALYZE FORECAST SUMMARY
========================
Location: ${displayName}
Latitude: ${data.location.lat}
Longitude: ${data.location.lon}
Prediction for: ${data.prediction_for}

PRECIPITATION (mm)
------------------
Ensemble prediction: ${numberFormatter.format(precipitation.prediction_mm)} mm
Uncertainty: ±${numberFormatter.format(precipitation.uncertainty_mm)} mm
Confidence interval: ${numberFormatter.format(precipitation.confidence_interval_mm.lower)} - ${numberFormatter.format(precipitation.confidence_interval_mm.upper)} mm

RAIN PROBABILITY
---------------
Probability: ${percentFormatter.format(rainProbability.probability)}
Confidence level: ${rainProbability.confidence_level}
Uncertainty: ±${rainProbability.uncertainty.toFixed(3)}

INDIVIDUAL MODEL PREDICTIONS
----------------------------
${precipitationBreakdown}

INDIVIDUAL MODEL PROBABILITIES
------------------------------
${probabilityBreakdown}

REGRESSION ENSEMBLE WEIGHTS
---------------------------
${regressionWeights}

CLASSIFICATION ENSEMBLE WEIGHTS
-------------------------------
${classificationWeights}

Generated at: ${new Date().toLocaleString("es-ES")}
    `.trim()

    const dataBlob = new Blob([textContent], { type: "text/plain" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `analyze-${baseFileSlug || "forecast"}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-sm border-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Forecast analysis</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Machine learning insights for {formattedDate}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {displayName}
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formattedDate}
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:gap-4 md:grid-cols-3 mt-6">
          <div className="p-4 rounded-xl border bg-primary/5 border-primary/40">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Droplets className="w-4 h-4" />
              Precipitation (ensemble)
            </div>
            <p className="text-2xl md:text-3xl font-semibold text-foreground mt-3">
              {numberFormatter.format(precipitation.prediction_mm)} mm
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ±{numberFormatter.format(precipitation.uncertainty_mm)} mm uncertainty
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-secondary/5 border-secondary/40">
            <div className="flex items-center gap-2 text-sm font-medium text-secondary">
              <Activity className="w-4 h-4" />
              Rain probability
            </div>
            <p className="text-2xl md:text-3xl font-semibold text-foreground mt-3">
              {percentFormatter.format(rainProbability.probability)}
            </p>
            <p className="text-xs text-muted-foreground mt-2 capitalize">
              {rainProbability.confidence_level} confidence • ±{rainProbability.uncertainty.toFixed(3)}
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-accent/5 border-accent/40">
            <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground">
              <Gauge className="w-4 h-4" />
              Confidence interval
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {numberFormatter.format(precipitation.confidence_interval_mm.lower)} mm -
              {" "}
              {numberFormatter.format(precipitation.confidence_interval_mm.upper)} mm
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Latitude {data.location.lat.toFixed(2)} • Longitude {data.location.lon.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      <BackendForecastInsights summary={data} />

      <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-sm border-2">
        <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">
          Download the analysis
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDownloadText}
            variant="outline"
            className="flex-1 h-11 md:h-12 border-2 bg-transparent text-sm md:text-base"
          >
            <Download className="w-4 h-4 mr-2" />
            Download as Text
          </Button>
          <Button
            onClick={handleDownloadJSON}
            variant="outline"
            className="flex-1 h-11 md:h-12 border-2 bg-transparent text-sm md:text-base"
          >
            <Download className="w-4 h-4 mr-2" />
            Download as JSON
          </Button>
        </div>
      </Card>
    </div>
  )
}
