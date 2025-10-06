# AtmosAtlas Frontend

AtmosAtlas is a Next.js application that transforms more than four decades of NASA climate archives into actionable insights for future event planning. The interface lets users search any global location, pick a future date, and instantly review historical weather analogs, probabilistic machine-learning ensembles, and risk indicators tailored to that selection.

## Features
- **Guided climate search experience** – Users can enter a place or coordinates, choose a planning date, and trigger an analysis from the landing page hero. The UI highlights value propositions such as historical intelligence, NASA validation, and future event planning support.
- **Interactive map with forward and reverse geocoding** – A Leaflet-powered map keeps the text input and coordinate picker in sync. Typing a location re-centers the map, while clicking the map performs reverse geocoding and fills the search form automatically.
- **Machine-learning forecast storytelling** – The weather results view blends animated conditions, classic meteorological metrics, downloadable reports, and ensemble explainability charts that surface precipitation confidence intervals, model weights, and derived risk scores.
- **Resilient backend proxy** – The `/api/weather` route orchestrates calls to the AtmosAtlas prediction service, retrying without ML when needed, normalizing responses, and generating risk scores when detailed explainability data is available.

## Tech Stack
- [Next.js 15 (App Router) and React 19](https://nextjs.org/) for rendering and routing.
- [TypeScript](https://www.typescriptlang.org/) across UI and API routes for type safety.
- [Tailwind CSS 4](https://tailwindcss.com/) with animate plugins for theming and motion.
- [Leaflet](https://leafletjs.com/) and [React Leaflet](https://react-leaflet.js.org/) for interactive mapping.
- [Recharts](https://recharts.org/) for visualizing ensemble probabilities and weights.

## Getting Started

### Prerequisites
- **Node.js 18.17+** (required by Next.js 15).
- **Package manager** – The repository includes both `pnpm-lock.yaml` and `package-lock.json`. Use whichever workflow your team prefers:
  - `corepack enable` (recommended) and then `pnpm install`
  - or `npm install`

### Installation
1. Clone the repository and open the project directory.
2. Install dependencies with your preferred package manager.
3. Create an `.env.local` file at the project root and define the environment variables below.

### Environment Variables
| Variable | Required | Description |
| --- | --- | --- |
| `ATMOS_BACKEND_URL` | Yes | Base URL for the AtmosAtlas backend providing the `/predict/advanced` endpoint. Used server-side to fetch climate intelligence. |
| `NEXT_PUBLIC_ATMOS_BACKEND_URL` | Optional | Public fallback for `ATMOS_BACKEND_URL` when deploying to environments that only expose `NEXT_PUBLIC_*` variables. |
| `ATMOS_USE_MULTISOURCE` | Optional (default `true`) | Controls whether to request multisource aggregation when calling the backend. |

### Run the Development Server
```bash
pnpm dev
# or
yarn dev
# or
npm run dev
```
The app starts at `http://localhost:3000` with hot reload enabled. Initiating a search will call the API route, which in turn contacts your configured backend.

### Build and Run for Production
```bash
pnpm build
pnpm start
```
These commands compile the Next.js application and serve the optimized production build.

### Linting
```bash
pnpm lint
```
Use this command to run the default Next.js lint rules.

## Data Flow Overview
1. The landing page manages search state and calls the `/api/weather` endpoint when users submit the form.
2. The API route normalizes request coordinates, invokes the AtmosAtlas backend, retries with `use_ml=false` on known ML errors, and constructs a rich `WeatherData` payload.
3. `WeatherDisplay` consumes that payload, rendering primary conditions, detailed explainability charts, and risk scores for rain, heat, cold, and humidity.

## Project Structure
```
app/                 # App Router pages, API routes, and global styles
components/          # Reusable UI pieces (search, weather display, Leaflet selector, charts)
hooks/               # Custom React hooks
lib/                 # Utility helpers (formatters, etc.)
public/              # Static assets (logos, icons)
styles/              # Additional style helpers
types/               # Shared TypeScript interfaces for weather data
```

## Mapping Notes
- Leaflet styles are globally imported from `app/globals.css`, so no extra setup is needed beyond installing dependencies.
- The map uses OpenStreetMap Nominatim APIs for geocoding and reverse geocoding; no API key is required, but respect the usage policy for production deployments.

## Contributing
1. Fork the repository and create a feature branch.
2. Make your changes and add tests or lint as needed.
3. Submit a pull request describing the improvement.

## License
This project inherits its license from the parent repository. Please consult your organization’s licensing guidelines if you plan to redistribute or open-source AtmosAtlas.
