import { type NextRequest, NextResponse } from "next/server"

// ---------------- Utilidades locales ----------------

interface Coordinates {
  lat: number
  lon: number
}

function hashStringToNumber(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function deriveCoordinates(location: string): Coordinates {
  const hash = hashStringToNumber(location)
  const lat = ((hash % 18000) / 100 - 90).toFixed(2)
  const lon = (((hash / 18000) % 36000) / 100 - 180).toFixed(2)
  return { lat: Number(lat), lon: Number(lon) }
}

function easeClamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function generateRiskScoresFromBackend(advProb: number, stat?: any, expl?: any) {
  const heatProb = Number(stat?.temperature?.hot_day_prob ?? 0)
  const coldProb = Number(stat?.temperature?.cold_day_prob ?? 0)
  const rh = Number(expl?.recent_summary?.rh2m_mean_pct ?? expl?.climatology_summary?.rh2m_mean_pct ?? 0)
  const humidityProb = easeClamp(rh / 100)

  return [
    { id: "rain", label: "Rain", probability: easeClamp(advProb), description: "Weighted consensus of advanced ML for rain probability." },
    { id: "heat", label: "Hot day", probability: easeClamp(heatProb), description: "Likelihood of unusually high temperatures for the date." },
    { id: "cold", label: "Cold day", probability: easeClamp(coldProb), description: "Likelihood of unusually low temperatures for the date." },
    { id: "humidity", label: "High humidity", probability: humidityProb, description: "Recent/typical humidity conditions may feel muggy." },
  ]
}

// Pseudodatos solo para “base weather” (no ML) cuando no hay API de tiempo actual:
function generatePseudoWeather(location: string, date: string, coordinates?: Coordinates) {
  const dateObj = new Date(date)
  const dayOfYear = Math.floor((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) / 86400000)
  const seed = dayOfYear + dateObj.getFullYear()

  const conditions = ["Clear", "Clouds", "Rain", "Drizzle", "Mist"] as const
  const descriptions = { Clear: "clear sky", Clouds: "partly cloudy", Rain: "moderate rain", Drizzle: "light drizzle", Mist: "mist" } as const

  const tempBase = 15 + Math.sin((dayOfYear / 365) * Math.PI * 2) * 15
  const tempVariation = (((seed * 9301 + 49297) % 233280) / 233280) * 10 - 5
  const temperature = Math.round((tempBase + tempVariation) * 10) / 10
  const humidityBase = 50 + Math.sin((dayOfYear / 365) * Math.PI * 2 + Math.PI) * 20
  const humidity = Math.max(20, Math.min(95, Math.round(humidityBase + (((seed * 1103 + 377) % 100) / 100) * 20)))
  const windSpeed = Math.round(5 + (((seed * 7919 + 1543) % 100) / 100) * 25)
  const visibility = Math.round(5 + (((seed * 3571 + 2879) % 100) / 100) * 10)
  const pressure = Math.round(990 + (((seed * 4561 + 1237) % 100) / 100) * 40)

  const condition = conditions[seed % conditions.length]
  const coords = coordinates ?? deriveCoordinates(location)

  return { location, temperature, condition, humidity, windSpeed, visibility, pressure, description: descriptions[condition], date, _coords: coords }
}

// ---------------- Llamada al backend AtmosAtlas ----------------

const ATMOS_BACKEND_URL = process.env.ATMOS_BACKEND_URL || process.env.NEXT_PUBLIC_ATMOS_BACKEND_URL || ""

// Geocodifica con OpenWeather si hay API key; si no, cae al hash
async function geocodeIfPossible(locationText: string, fallback: Coordinates): Promise<Coordinates> {
  try {
    const key = process.env.OPENWEATHER_API_KEY
    if (!key) return fallback
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationText)}&limit=1&appid=${key}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return fallback
    const arr = (await res.json()) as Array<{ lat: number; lon: number }>
    if (arr && arr.length > 0 && typeof arr[0].lat === "number" && typeof arr[0].lon === "number") {
      return { lat: arr[0].lat, lon: arr[0].lon }
    }
    return fallback
  } catch {
    return fallback
  }
}

function normalizedEndDate(targetDate: string) {
  // El backend valida que target_date sea posterior a end_date (histórico)
  const y = Number(targetDate.slice(0, 4))
  const endYear = Math.min(y - 1, 2024)
  return `${endYear}-12-31`
}

function stdDev(values: number[]) {
  if (!values.length) return 0
  const m = values.reduce((a, b) => a + b, 0) / values.length
  const v = values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length
  return Math.sqrt(v)
}

async function fetchBackendAdvanced(coords: Coordinates, targetDate: string) {
  if (!ATMOS_BACKEND_URL) throw new Error("Missing ATMOS_BACKEND_URL")

  const url = `${ATMOS_BACKEND_URL.replace(/\/$/, "")}/predict/advanced?use_multisource=false&explain_recent_days=14`
  const body = {
    latitude: coords.lat,
    longitude: coords.lon,
    target_date: targetDate,
    start_date: "1990-01-01",
    end_date: normalizedEndDate(targetDate),
    window_days: 7,
    rain_threshold: 0.5,
    use_ml: true,
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000) // 60s timeout

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: controller.signal,
  })

  clearTimeout(timeout)

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Backend error ${res.status}: ${text}`)
  }

  return (await res.json()) as any
}

function mapBackendToFrontendSummary(api: any) {
  // OJO: el back manda location.{latitude, longitude}, no {lat,lon}
  const loc = api?.location ?? {}
  const backLat = Number(loc.latitude ?? loc.lat ?? 0)
  const backLon = Number(loc.longitude ?? loc.lon ?? 0)

  const adv = api?.ml_advanced?.advanced_ml ?? {}
  const weights = api?.ml_advanced?.model_weights ?? {}
  const individual = adv?.individual_models ?? {}

  const regEntries = Object.entries(individual).filter(([k]) => k.startsWith("reg_"))
  const clsEntries = Object.entries(individual).filter(([k]) => k.startsWith("cls_"))

  const individual_predictions_mm = Object.fromEntries(regEntries.map(([k, v]) => [k.replace(/^reg_/, ""), Number(v)]))
  const individual_probabilities = Object.fromEntries(clsEntries.map(([k, v]) => [k.replace(/^cls_/, ""), Number(v)]))

  const prediction_mm = Number(adv?.precipitation_mm ?? 0)
  const ci = adv?.confidence_interval ?? { lower: 0, upper: 0 }
  const uncertainty_mm = Number(adv?.uncertainty ?? 0)
  const probFused = Number(adv?.rain_probability_fused ?? 0)
  const clsStd = stdDev(Object.values(individual_probabilities).map(Number))
  const clsConfidence = String(adv?.confidence_level ?? "medium")

  return {
    prediction_for: String(api?.target_date ?? new Date().toISOString().split("T")[0]),
    location: { lat: backLat, lon: backLon },
    ml_precipitation_mm: {
      prediction_mm,
      individual_predictions_mm,
      uncertainty_mm,
      confidence_interval_mm: { lower: Number(ci?.lower ?? 0), upper: Number(ci?.upper ?? 0) },
      ensemble_weights_reg: (weights?.regression ?? {}) as Record<string, number>,
    },
    ml_rain_probability: {
      probability: probFused,
      individual_probabilities,
      uncertainty: clsStd,
      confidence_level: clsConfidence,
      ensemble_weights_cls: (weights?.classification ?? {}) as Record<string, number>,
    },
  }
}

// ---------------- Handler HTTP ----------------

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const locationParam = searchParams.get("location")?.trim() || ""
  const dateParam = searchParams.get("date") || undefined
  const latParam = searchParams.get("lat")
  const lonParam = searchParams.get("lon")

  const lat = latParam ? Number.parseFloat(latParam) : undefined
  const lon = lonParam ? Number.parseFloat(lonParam) : undefined

  if (!locationParam && (lat === undefined || lon === undefined)) {
    return NextResponse.json({ error: "Provide either 'location' or both 'lat' and 'lon'." }, { status: 400 })
  }

  const targetDate = dateParam ?? new Date().toISOString().split("T")[0]
  const locationText = locationParam || `${lat!.toFixed(2)}, ${lon!.toFixed(2)}`

  // Coordenadas: prioriza query lat/lon → luego geocoding → fallback hash
  const fallback = lat !== undefined && lon !== undefined ? { lat, lon } : deriveCoordinates(locationText)
  const coords: Coordinates =
    lat !== undefined && lon !== undefined
      ? { lat, lon }
      : await geocodeIfPossible(locationText, fallback)

  try {
    // 1) Datos meteo base (OpenWeather si hay key, si no pseudo)
    let baseWeather: any
    if (!dateParam) {
      try {
        const apiKey = process.env.OPENWEATHER_API_KEY
        if (!apiKey) throw new Error("no-key")
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=en`,
        )
        if (!response.ok) throw new Error(String(response.status))
        const data = await response.json()
        baseWeather = {
          location: `${data.name}, ${data.sys?.country ?? ""}`.trim(),
          temperature: data.main?.temp ?? 22,
          condition: data.weather?.[0]?.main ?? "Clear",
          humidity: data.main?.humidity ?? 65,
          windSpeed: Math.round((data.wind?.speed ?? 3) * 3.6),
          visibility: Math.round((data.visibility ?? 10000) / 1000),
          pressure: data.main?.pressure ?? 1013,
          description: data.weather?.[0]?.description ?? "clear sky",
          date: targetDate,
        }
      } catch {
        const pseudo = generatePseudoWeather(locationText, targetDate, coords)
        baseWeather = { location: locationText, ...pseudo, _coords: coords }
      }
    } else {
      const pseudo = generatePseudoWeather(locationText, targetDate, coords)
      baseWeather = { location: locationText, ...pseudo, _coords: coords }
    }

    // 2) Llamada al backend AtmosAtlas (predict/advanced) y mapeo
    let backendSummary: any | undefined
    let riskScores: any[] | undefined
    try {
      const api = await fetchBackendAdvanced(coords, targetDate)
      backendSummary = mapBackendToFrontendSummary(api)
      const advProb = Number(backendSummary?.ml_rain_probability?.probability ?? 0)
      riskScores = generateRiskScoresFromBackend(advProb, api?.statistics, api?.explainability)
    } catch (err) {
      console.error("[weather] Backend call failed:", err)
      backendSummary = undefined
      riskScores = undefined
    }

    return NextResponse.json({ ...baseWeather, backendSummary, riskScores })
  } catch (error) {
    console.error("[weather] Error:", error)
    return NextResponse.json(
      { error: "Unexpected error while fetching weather/ML. Check ATMOS_BACKEND_URL and that the backend is running." },
      { status: 500 },
    )
  }
}
