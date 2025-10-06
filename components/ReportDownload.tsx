// components/ReportDownload.tsx
"use client"

import { fmtDateISO, fmtNumber, fmtPercent } from "@/lib/format"
import { STR } from "@/lib/strings"

function buildReportText(data: any) {
  const lines: string[] = []
  lines.push("WEATHER FORECAST")
  lines.push("===============")
  lines.push("")
  lines.push(`Location: ${data?.location ?? "—"}`)
  lines.push(`Date: ${fmtDateISO(data?.date, "en-US")}`)
  lines.push("")

  if (Number.isFinite(Number(data?.temperature))) lines.push(`Temperature: ${Number(data.temperature)}°C`)
  if (data?.condition) lines.push(`Condition: ${data.condition}`)
  lines.push("")
  lines.push("DETAILS")
  lines.push("-------")
  if (Number.isFinite(Number(data?.humidity))) lines.push(`Humidity: ${Number(data.humidity)}%`)
  if (Number.isFinite(Number(data?.windSpeed))) lines.push(`Wind speed: ${Number(data.windSpeed)} km/h`)
  if (Number.isFinite(Number(data?.visibility))) lines.push(`Visibility: ${Number(data.visibility)} km`)
  if (Number.isFinite(Number(data?.pressure))) lines.push(`Pressure: ${Number(data.pressure)} hPa`)
  lines.push("")
  lines.push("MACHINE LEARNING INSIGHTS")
  lines.push("------------------------")

  const sum = data?.backendSummary
  const rich = data?.backendSummaryRich
  if (sum?.ml_precipitation_mm) {
    const ci = sum.ml_precipitation_mm.confidence_interval_mm
    lines.push(
      `Precipitation (ensemble): ${fmtNumber(sum.ml_precipitation_mm.prediction_mm, 3)} mm ± ` +
      `${fmtNumber(sum.ml_precipitation_mm.uncertainty_mm, 3)}`
    )
    if (ci) {
      lines.push(`95% CI: ${fmtNumber(ci.lower, 3)} – ${fmtNumber(ci.upper, 3)} mm`)
    }
  }

  // probability: use final weighted if present
  const pFinal = Number(rich?.probabilities?.final_weighted)
  const pAdv = Number(sum?.ml_rain_probability?.probability)
  const usedP = Number.isFinite(pFinal) ? pFinal : pAdv
  const conf = String(
    rich?.probabilities?.final_confidence ??
    sum?.ml_rain_probability?.confidence_level ?? "medium"
  )
  lines.push(`Rain probability: ${fmtPercent(usedP, 1)}`)
  lines.push(`Confidence level: ${conf}`)
  lines.push("")

  if (Array.isArray(data?.riskScores)) {
    lines.push("CONDITION RISKS")
    lines.push("----------------")
    for (const r of data.riskScores) {
      lines.push(`${r.label}: ${Math.round((r.probability ?? 0) * 100)}% - ${r.description}`)
    }
    lines.push("")
  }

  lines.push(`${STR.generatedAt}: ${new Date().toLocaleString("en-US")}`)
  return lines.join("\n")
}

export function ReportDownload({ data }: { data: any }) {
  const onDownload = () => {
    const text = buildReportText(data)
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "weather_forecast.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={onDownload} className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm">
      Download TXT
    </button>
  )
}
