// components/WeatherDetails.tsx
"use client"

import { STR } from "@/lib/strings"
import { fmtMaybe } from "@/lib/format"

type Props = {
  data: {
    condition?: string
    temperature?: number
    humidity?: number
    windSpeed?: number
    visibility?: number
    pressure?: number
  } | null
}

export function WeatherDetails({ data }: Props) {
  if (!data) return null
  const hasAny =
    data.condition ||
    Number.isFinite(Number(data.temperature)) ||
    Number.isFinite(Number(data.humidity)) ||
    Number.isFinite(Number(data.windSpeed)) ||
    Number.isFinite(Number(data.visibility)) ||
    Number.isFinite(Number(data.pressure))

  if (!hasAny) return null

  return (
    <div className="space-y-2">
      <h3 className="font-medium">{STR.details}</h3>

      {Number.isFinite(Number(data.temperature)) && (
        <div className="text-sm">
          <span className="text-muted-foreground">{STR.temperature}:</span>{" "}
          {fmtMaybe(data.temperature, "°C")}
        </div>
      )}

      {data.condition && (
        <div className="text-sm">
          <span className="text-muted-foreground">{STR.condition}:</span>{" "}
          {data.condition}
        </div>
      )}

      {Number.isFinite(Number(data.humidity)) && (
        <div className="text-sm">
          <span className="text-muted-foreground">{STR.humidity}:</span>{" "}
          {fmtMaybe(data.humidity, "%")}
        </div>
      )}

      {Number.isFinite(Number(data.windSpeed)) && (
        <div className="text-sm">
          <span className="text-muted-foreground">{STR.wind}:</span>{" "}
          {fmtMaybe(data.windSpeed, " km/h")}
        </div>
      )}

      {Number.isFinite(Number(data.visibility)) && (
        <div className="text-sm">
          <span className="text-muted-foreground">{STR.visibility}:</span>{" "}
          {fmtMaybe(data.visibility, " km")}
        </div>
      )}

      {Number.isFinite(Number(data.pressure)) && (
        <div className="text-sm">
          <span className="text-muted-foreground">{STR.pressure}:</span>{" "}
          {fmtMaybe(data.pressure, " hPa")}
        </div>
      )}
    </div>
  )
}
