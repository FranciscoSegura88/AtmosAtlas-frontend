// components/ReportDownload.tsx
"use client"

import { fmtDateLocalYMD, fmtNumber, fmtPercent } from "@/lib/format"
import { STR } from "@/lib/strings"

function buildReportText(data: any) {
  const sum = data?.backendSummary
  const rich = data?.backendSummaryRich

  const lines: string[] = []
  lines.push("WEATHER FORECAST")
  lines.push("===============")
  lines.push("")
  lines.push(`Location: ${data?.location ?? "—"}`)
  lines.push(`Date: ${fmtDateLocalYMD(data?.date, "en-US")}`)
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

  const pFinal = Number(rich?.probabilities?.final_weighted)
  const pAdv = Number(sum?.ml_rain_probability?.probability)
  const usedP = Number.isFinite(pFinal) ? pFinal : pAdv
  const conf =
    String(rich?.probabilities?.final_confidence ??
      sum?.ml_rain_probability?.confidence_level ?? "medium")

  const mm = Number(sum?.ml_precipitation_mm?.prediction_mm ?? 0)
  const ciLo = Number(sum?.ml_precipitation_mm?.confidence_interval_mm?.lower ?? 0)
  const ciHi = Number(sum?.ml_precipitation_mm?.confidence_interval_mm?.upper ?? 0)
  const unc = Number(sum?.ml_precipitation_mm?.uncertainty_mm ?? 0)

  lines.push(`Precipitation (ensemble): ${fmtNumber(mm, 3)} mm ± ${fmtNumber(unc, 3)}`)
  lines.push(`Rain probability: ${fmtPercent(usedP, 1)}`)
  lines.push(`Confidence level: ${conf}`)
  lines.push("")

  if (Array.isArray(data?.riskScores)) {
    lines.push("")
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
