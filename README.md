# AtmosAtlas Frontend

AtmosAtlas Frontend is a Next.js 15 application that lets planners explore weather risk insights for a specific date and set of coordinates. Users search for a place, pick a target day, and the interface calls the AtmosAtlas backend (`/analyze`) to display precipitation ensemble statistics, rain probability, and supporting machine-learning diagnostics.

## Features

- **Interactive location picker** – Type an address and fine-tune the exact coordinates on an embedded Leaflet map. The UI reverse-geocodes map clicks so the backend always receives both latitude and longitude values.
- **Backend-driven forecasts** – The search form validates the map selection and date before issuing a request to `http://127.0.0.1:8000/analyze` (or a configured URL) with the `lat`, `lon`, and `target_date` query parameters.
- **Rich analytics presentation** – Forecast cards summarize ensemble precipitation, probability, uncertainty bands, and location metadata, while detailed charts break down model contributions, weights, and confidence intervals.
- **Downloadable exports** – Users can download the current analysis as formatted JSON or plain text reports for offline review.

## Tech stack

- [Next.js 15](https://nextjs.org/) with the App Router
- [React 19](https://react.dev/) and TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling, plus shadcn/ui primitives
- [Leaflet](https://leafletjs.com/) for map interactions
- [Recharts](https://recharts.org/en-US/) for animated visualizations

## Getting started

### Prerequisites

- Node.js 18.18 or later (Node 20 LTS recommended)
- [pnpm](https://pnpm.io/) 9 or newer

### Installation

```bash
pnpm install
```

### Configure environment variables

Copy `.env.example` to `.env.local` if available, or create `.env.local` at the project root and define the AtmosAtlas backend endpoint:

```bash
NEXT_PUBLIC_BACKEND_ANALYZE_URL="http://127.0.0.1:8000/analyze"
```

> The app defaults to `http://127.0.0.1:8000/analyze` when the variable is omitted. Use the environment variable when the backend is hosted elsewhere.

### Run the development server

```bash
pnpm dev
```

The site is now available at [http://localhost:3000](http://localhost:3000). Any code changes automatically trigger hot reloading.

### Build for production

```bash
pnpm build
pnpm start
```

`pnpm build` compiles the application, and `pnpm start` runs the optimized production server.

### Linting

The project includes the default Next.js ESLint configuration:

```bash
pnpm lint
```

If ESLint prompts to install additional presets on first run, accept the suggestions or add the desired rules before re-running the command.

## Project structure

| Path | Description |
| --- | --- |
| `app/page.tsx` | Home page that wires the search form to the backend request and renders results. |
| `components/search-bar.tsx` | Location/date form with Leaflet map integration and validations. |
| `components/map-selector.tsx` | Lazily loads Leaflet, reverse-geocodes clicks, and emits coordinates. |
| `components/weather-display.tsx` | Displays precipitation and probability summaries, download actions, and embeds insights. |
| `components/backend-forecast-insights.tsx` | Charts ensemble members, weights, and confidence metrics. |
| `types/weather.ts` | TypeScript definitions matching the `/analyze` response payload. |

## Backend contract

The frontend expects the AtmosAtlas backend to expose `GET /analyze` and respond with JSON shaped like:

```json
{
  "prediction_for": "2026-07-20",
  "location": { "lat": 20.67, "lon": -103.35 },
  "ml_precipitation_mm": {
    "prediction_mm": 123.45,
    "individual_predictions_mm": { "rf": 0.9, "ridge": 1.2 },
    "uncertainty_mm": 15.5,
    "confidence_interval_mm": { "lower": 100.0, "upper": 140.0 },
    "ensemble_weights_reg": { "rf": 0.4, "ridge": 0.6 }
  },
  "ml_rain_probability": {
    "probability": 0.42,
    "individual_probabilities": { "rf": 0.5, "xgb": 0.35 },
    "uncertainty": 0.07,
    "confidence_level": "medium",
    "ensemble_weights_cls": { "rf": 0.3, "xgb": 0.7 }
  }
}
```

The UI reads the `lat`, `lon`, and `target_date` values from the search form and forwards them as query parameters when calling the backend. Additional properties are preserved but ignored by the current interface.

## Deployment

Deploy the production build to any environment that supports Node.js servers (e.g., Vercel, Render, or Docker). Make sure the backend endpoint is reachable from the deployed frontend and expose `NEXT_PUBLIC_BACKEND_ANALYZE_URL` with the publicly accessible URL.

## Contributing

1. Fork the repository and create a feature branch.
2. Run `pnpm install` to install dependencies.
3. Implement your changes along with tests when applicable.
4. Run `pnpm lint` and address issues.
5. Open a pull request describing the changes and testing strategy.

## License

This project is provided as-is for the AtmosAtlas challenge. Add licensing details here if redistribution terms change.
