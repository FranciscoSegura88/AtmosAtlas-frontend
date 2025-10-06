export interface BackendSummary {
  prediction_for: string
  location: {
    lat: number
    lon: number
  }
  ml_precipitation_mm: {
    prediction_mm: number
    individual_predictions_mm: Record<string, number>
    uncertainty_mm: number
    confidence_interval_mm: {
      lower: number
      upper: number
    }
    ensemble_weights_reg: Record<string, number>
  }
  ml_rain_probability: {
    probability: number
    individual_probabilities: Record<string, number>
    uncertainty: number
    confidence_level: string
    ensemble_weights_cls: Record<string, number>
  }
}

export interface WeatherData extends BackendSummary {
  /**
   * Optional display name provided by the UI for the analyzed location.
   */
  locationLabel?: string
  /**
   * Optional metadata preserved for legacy components that expect these fields.
   */
  name?: string
  sys?: {
    country?: string
  }
  timezone?: number
}

export type AnalyzeResponse = BackendSummary

export interface LocationData {
  lat: number
  lng: number
  name: string
  country?: string
  timezone?: number
}
