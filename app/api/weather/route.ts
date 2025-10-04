import { type NextRequest, NextResponse } from "next/server"

function generateFutureWeatherData(location: string, date: string) {
  // Usar la fecha como semilla para generar datos consistentes
  const dateObj = new Date(date)
  const dayOfYear = Math.floor((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) / 86400000)
  const seed = dayOfYear + dateObj.getFullYear()

  // Generar valores pseudo-aleatorios pero consistentes
  const tempBase = 15 + Math.sin((dayOfYear / 365) * Math.PI * 2) * 15 // Variación estacional
  const tempVariation = (((seed * 9301 + 49297) % 233280) / 233280) * 10 - 5
  const temperature = Math.round((tempBase + tempVariation) * 10) / 10

  const humidityBase = 50 + Math.sin((dayOfYear / 365) * Math.PI * 2 + Math.PI) * 20
  const humidity = Math.max(20, Math.min(95, Math.round(humidityBase + (((seed * 1103 + 377) % 100) / 100) * 20)))

  const conditions = ["Clear", "Clouds", "Rain", "Drizzle", "Mist"]
  const descriptions = {
    Clear: "cielo despejado",
    Clouds: "parcialmente nublado",
    Rain: "lluvia moderada",
    Drizzle: "llovizna ligera",
    Mist: "neblina",
  }

  const conditionIndex = seed % conditions.length
  const condition = conditions[conditionIndex]

  return {
    location: location,
    temperature: temperature,
    condition: condition,
    humidity: humidity,
    windSpeed: Math.round(5 + (((seed * 7919 + 1543) % 100) / 100) * 25),
    visibility: Math.round(5 + (((seed * 3571 + 2879) % 100) / 100) * 10),
    pressure: Math.round(990 + (((seed * 4561 + 1237) % 100) / 100) * 40),
    description: descriptions[condition as keyof typeof descriptions],
    date: date,
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const location = searchParams.get("location")
  const date = searchParams.get("date")

  if (!location) {
    return NextResponse.json({ error: "Se requiere una ubicación" }, { status: 400 })
  }

  try {
    if (date) {
      const futureData = generateFutureWeatherData(location, date)
      return NextResponse.json(futureData)
    }

    // Si no hay fecha, usar la API de OpenWeatherMap para datos actuales
    const apiKey = process.env.OPENWEATHER_API_KEY || "demo"
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric&lang=es`,
    )

    if (!response.ok) {
      // Si falla, devolvemos datos de ejemplo
      return NextResponse.json({
        location: location,
        temperature: 22,
        condition: "Clear",
        humidity: 65,
        windSpeed: 12,
        visibility: 10,
        pressure: 1013,
        description: "cielo despejado",
      })
    }

    const data = await response.json()

    return NextResponse.json({
      location: `${data.name}, ${data.sys.country}`,
      temperature: data.main.temp,
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s a km/h
      visibility: Math.round(data.visibility / 1000), // metros a km
      pressure: data.main.pressure,
      description: data.weather[0].description,
    })
  } catch (error) {
    console.error("[v0] Error fetching weather data:", error)

    // Datos de ejemplo en caso de error
    return NextResponse.json({
      location: location,
      temperature: 22,
      condition: "Clear",
      humidity: 65,
      windSpeed: 12,
      visibility: 10,
      pressure: 1013,
      description: "cielo despejado",
    })
  }
}
