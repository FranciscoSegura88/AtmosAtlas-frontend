// types/weather.ts

export interface EnsembleWeights {
  [key: string]: number
}

export interface BackendSummary {
  prediction_for: string
  location: { lat: number; lon: number }
  ml_precipitation_mm: {
    prediction_mm: number
    individual_predictions_mm: Record<string, number>
    uncertainty_mm: number
    confidence_interval_mm: { lower: number; upper: number }
    ensemble_weights_reg: EnsembleWeights
  }
  ml_rain_probability: {
    probability: number
    individual_probabilities: Record<string, number>
    uncertainty: number
    confidence_level: string
    ensemble_weights_cls: EnsembleWeights
  }
}

export interface BackendSummaryRich {
  probabilities: {
    statistical: number
    ml_basic: number
    ml_advanced: number
    final_weighted: number
    final_will_rain: boolean
    final_confidence: string
  }
  explainability: {
    recent_summary: any
    climatology_summary: any
    explanation_text: string
    model_top_features: Array<any>
  }
  data_coverage: {
    start: string | null
    end: string | null
    n_days: number | null
    n_years: number | null
  }
  data_quality: {
    reliability_score: number
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
  date: string
  temperature?: number
  condition?: string
  humidity?: number
  windSpeed?: number
  pressure?: number
  visibility?: number
  backendSummary?: BackendSummary
  backendSummaryRich?: BackendSummaryRich
  riskScores?: ConditionRisk[]
  error?: string
}

export interface LocationData {
  lat: number
  lng: number
  name?: string
  country?: string
  timezone?: number
}
