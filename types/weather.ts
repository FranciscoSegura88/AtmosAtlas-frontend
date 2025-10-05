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

export interface ConditionRisk {
  id: string
  label: string
  probability: number
  description: string
}

export interface WeatherData {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  visibility: number
  pressure: number
  description: string
  date?: string
  backendSummary?: BackendSummary
  riskScores?: ConditionRisk[]
}
