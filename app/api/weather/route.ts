import { type NextRequest, NextResponse } from "next/server"

/**
 * app/api/weather/route.ts
 * - Backend-only (no OpenWeather live conditions).
 * - Calls /predict/advanced with use_multisource=true (same as CLI --multisource).
 * - Retries with use_ml=false on typical ML/NaN errors for graceful degradation.
 * - Exposes a rich summary (stats/basic/advanced/final probabilities, explainability, coverage, data quality)
 *   plus the detailed ml_advanced summary.
 * - Derives UI-facing fields (condition/humidity/temperature/wind/pressure) from backend explainability/statistics
 *   and avoids printing undefined.
 */

// ---------------- Local utilities ----------------

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

const ATMOS_BACKEND_URL = process.env.ATMOS_BACKEND_URL || process.env.NEXT_PUBLIC_ATMOS_BACKEND_URL || ""
const ATMOS_USE_MULTISOURCE = (process.env.ATMOS_USE_MULTISOURCE ?? "true").toLowerCase() === "true"

// Geocode via OpenWeather if key exists; otherwise fall back to hash
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
  // Backend requires target_date > end_date (historical)
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

function pickNumber(n: any, def = 0) {
  const v = Number(n)
  return Number.isFinite(v) ? v : def
}

// ---------------- Backend client ----------------

type FetchOpts = { useML?: boolean }

async function callBackend(coords: Coordinates, targetDate: string, opts: FetchOpts = {}) {
  if (!ATMOS_BACKEND_URL) throw new Error("Missing ATMOS_BACKEND_URL")
  const use_ml = opts.useML ?? true

  const url =
    `${ATMOS_BACKEND_URL.replace(/\/$/, "")}/predict/advanced` +
    `?use_multisource=${ATMOS_USE_MULTISOURCE ? "true" : "false"}&explain_recent_days=14`

  const body = {
    latitude: coords.lat,
    longitude: coords.lon,
    target_date: targetDate,
    start_date: "1990-01-01",
    end_date: normalizedEndDate(targetDate),
    window_days: 7,
    rain_threshold: 0.5,
    use_ml,
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

  const text = await res.text().catch(() => "")
  if (!res.ok) throw new Error(`Backend error ${res.status}: ${text}`)
  try {
    return JSON.parse(text)
  } catch {
    // If backend returns valid JSON with BOM/extra whitespace
    return JSON.parse(text.trim())
  }
}

async function fetchBackendAdvanced(coords: Coordinates, targetDate: string) {
  try {
    return await callBackend(coords, targetDate, { useML: true })
  } catch (e: any) {
    const msg = String(e?.message ?? "").toLowerCase()
    const shouldRetryWithoutML =
      msg.includes("two classes") ||
      msg.includes("only one class is present") ||
      msg.includes("out of range float values") ||
      msg.includes("nan")

    if (shouldRetryWithoutML) {
      // Graceful retry: disable ML to keep UI responsive
      return await callBackend(coords, targetDate, { useML: false })
    }
    throw e
  }
}

// ---------------- Mappers ----------------

/** Detailed ml_advanced summary (models, weights, mm CI, fused prob) */
function mapBackendToFrontendSummary(api: any) {
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

  const rawPredictionMm = Number(adv?.precipitation_mm ?? 0)
  const prediction_mm = Math.max(0, Number.isFinite(rawPredictionMm) ? rawPredictionMm : 0)

  const ci = adv?.confidence_interval ?? { lower: 0, upper: 0 }
  const uncertainty_mm = Number.isFinite(Number(adv?.uncertainty)) ? Number(adv?.uncertainty) : 0
  const probFused = Number.isFinite(Number(adv?.rain_probability_fused)) ? Number(adv?.rain_probability_fused) : 0
  const clsStd = stdDev(Object.values(individual_probabilities).map(Number))
  const clsConfidence = String(adv?.confidence_level ?? "medium")

  return {
    prediction_for: String(api?.target_date ?? new Date().toISOString().split("T")[0]),
    location: { lat: backLat, lon: backLon },
    ml_precipitation_mm: {
      prediction_mm,
      individual_predictions_mm,
      uncertainty_mm,
      confidence_interval_mm: {
        lower: Math.max(0, Number(ci?.lower ?? 0)),
        upper: Number(ci?.upper ?? 0),
      },
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

/** Rich summary: mirrors CLI (stats/basic/advanced/final, explainability, coverage, quality) */
function buildRichBackendSummary(api: any) {
  const final   = api?.final_recommendation ?? {}
  const stats   = api?.statistics ?? {}
  const basic   = api?.ml_basic ?? {}
  const advRoot = api?.ml_advanced ?? {}
  const adv     = advRoot?.advanced_ml ?? {}
  const expl    = api?.explainability ?? {}
  const cov     = api?.data_coverage ?? {}
  const dq      = api?.data_quality ?? {}

  const prob_stat   = pickNumber(stats?.rain_probability, 0)
  const prob_basic  = pickNumber(basic?.prediction?.ensemble_prob, 0)
  const prob_adv    = pickNumber(adv?.rain_probability_fused, 0)
  const will_rain   = !!final?.will_rain
  const final_prob  = pickNumber(final?.probability, Math.max(prob_adv, prob_basic, prob_stat))
  const confidence  = String(final?.confidence ?? adv?.confidence_level ?? "medium")

  return {
    probabilities: {
      statistical: prob_stat,
      ml_basic:    prob_basic,
      ml_advanced: prob_adv,
      final_weighted: final_prob,
      final_will_rain: will_rain,
      final_confidence: confidence,
    },
    explainability: {
      recent_summary: expl?.recent_summary ?? {},
      climatology_summary: expl?.climatology_summary ?? {},
      explanation_text: expl?.explanation_text ?? "",
      model_top_features: expl?.model_top_features ?? [],
    },
    data_coverage: {
      start: cov?.start ?? null,
      end:   cov?.end ?? null,
      n_days:  cov?.n_days ?? null,
      n_years: cov?.n_years ?? null,
    },
    data_quality: {
      reliability_score: pickNumber(dq?.reliability?.overall_score, NaN),
    },
  }
}

/** Derive UI “showcase” fields from backend (avoid undefined) */
function deriveShowcaseFromBackend(api: any) {
  const stats = api?.statistics ?? {}
  const expl = api?.explainability ?? {}

  // Humidity (%) from summaries
  const rh = Number(
    expl?.recent_summary?.rh2m_mean_pct ?? expl?.climatology_summary?.rh2m_mean_pct ?? NaN
  )
  const humidity = Number.isFinite(rh) ? Math.round(rh) : undefined

  // Wind: m/s -> km/h
  const windMs = Number(
    expl?.recent_summary?.wind_mean_ms ?? expl?.climatology_summary?.wind_mean_ms ?? NaN
  )
  const windSpeed = Number.isFinite(windMs) ? Math.round(windMs * 3.6) : undefined

  // Pressure: kPa -> hPa
  const psKpa = Number(
    expl?.recent_summary?.ps_mean_kpa ?? expl?.climatology_summary?.ps_mean_kpa ?? NaN
  )
  const pressure = Number.isFinite(psKpa) ? Math.round(psKpa * 10) : undefined

  // Temperature (°C): prefer statistics; fallback to explainability
  const tFromStats = Number(stats?.temperature?.avg_temp_c ?? stats?.temperature?.mean_c ?? NaN)
  const tFromExpl = Number(
    expl?.recent_summary?.t2m_mean_c ?? expl?.climatology_summary?.t2m_mean_c ?? NaN
  )
  const temperature = Number.isFinite(tFromStats)
    ? Math.round(tFromStats)
    : Number.isFinite(tFromExpl)
    ? Math.round(tFromExpl)
    : undefined

  return { humidity, windSpeed, pressure, temperature }
}

function inferCondition(probFinalWeighted: number, humidity?: number, mm?: number) {
  // Simple, robust heuristic for display:
  if ((mm ?? 0) >= 0.5 || probFinalWeighted >= 0.6) return "Rain"
  if (probFinalWeighted >= 0.35 && (humidity ?? 0) >= 70) return "Drizzle"
  if ((humidity ?? 0) >= 75) return "Clouds"
  return "Clear"
}

// ---------------- HTTP handler ----------------

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

  // Coordinates: prioritize query lat/lon → geocoding → hash fallback
  const fallback = lat !== undefined && lon !== undefined ? { lat, lon } : deriveCoordinates(locationText)
  const coords: Coordinates =
    lat !== undefined && lon !== undefined
      ? { lat, lon }
      : await geocodeIfPossible(locationText, fallback)

  try {
    // 1) Backend (with graceful retry)
    const api = await fetchBackendAdvanced(coords, targetDate)

    // 2) Mappings
    const backendSummary = mapBackendToFrontendSummary(api)      // detailed ml_advanced
    const backendSummaryRich = buildRichBackendSummary(api)      // CLI-style rich block
    const advProb = Number(backendSummary?.ml_rain_probability?.probability ?? 0)
    const mm = Number(backendSummary?.ml_precipitation_mm?.prediction_mm ?? 0)

    // 3) UI showcase (no undefined)
    const { humidity, windSpeed, pressure, temperature } = deriveShowcaseFromBackend(api)
    const probFinal = backendSummaryRich.probabilities.final_weighted
    const condition = inferCondition(probFinal, humidity, mm) || "Clear"

    // 4) Risk outlook
    const riskScores = generateRiskScoresFromBackend(
      Number.isFinite(Number(probFinal)) ? Number(probFinal) : advProb,
      api?.statistics,
      api?.explainability
    )

    // 5) Response
    return NextResponse.json({
      // meta
      location: `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
      date: targetDate,

      // showcase (only if defined)
      ...(Number.isFinite(Number(temperature)) ? { temperature: Number(temperature) } : {}),
      ...(condition ? { condition } : {}),
      ...(Number.isFinite(Number(humidity)) ? { humidity: Number(humidity) } : {}),
      ...(Number.isFinite(Number(windSpeed)) ? { windSpeed: Number(windSpeed) } : {}),
      ...(Number.isFinite(Number(pressure)) ? { pressure: Number(pressure) } : {}),

      // backend payloads
      backendSummary,         // detailed advanced_ml (mm/probs/weights/individuals)
      backendSummaryRich,     // stats/basic/advanced/final + explainability + coverage + quality

      // risks
      riskScores,
    })
  } catch (error) {
    console.error("[weather] Error:", error)
    return NextResponse.json(
      { error: "Unexpected error while fetching ML from backend. Check ATMOS_BACKEND_URL and that the backend is running." },
      { status: 500 },
    )
  }
}
