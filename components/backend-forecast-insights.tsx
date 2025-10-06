"use client"

import { Card } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/animated-number"
import { Activity, Droplets, MapPin } from "lucide-react"
import type { BackendSummary } from "@/types/weather"
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  CartesianGrid,
  XAxis,
  Tooltip,
  Bar,
  Cell,
} from "recharts"

interface BackendForecastInsightsProps {
  summary: BackendSummary
}

const probabilityColors = ["#38bdf8", "#1e40af"]
const precipitationColors = ["#22c55e", "#16a34a", "#15803d", "#0f766e", "#0ea5e9", "#1d4ed8"]
const weightColors = ["#fb7185", "#f97316", "#facc15", "#34d399", "#38bdf8"]

const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`

export function BackendForecastInsights({ summary }: BackendForecastInsightsProps) {
  const probabilityPercent = Number((summary.ml_rain_probability.probability * 100).toFixed(1))

  const precipitationModels = Object.entries(summary.ml_precipitation_mm.individual_predictions_mm).map(
    ([model, value]) => ({
      model: model.toUpperCase(),
      value,
    }),
  )

  const regressionWeights = Object.entries(summary.ml_precipitation_mm.ensemble_weights_reg).map(([model, value]) => ({
    model: model.toUpperCase(),
    value,
  }))

  const probabilityModels = Object.entries(summary.ml_rain_probability.individual_probabilities).map(([model, value]) => ({
    model: model.toUpperCase(),
    value,
  }))

  const classificationWeights = Object.entries(summary.ml_rain_probability.ensemble_weights_cls).map(([model, value]) => ({
    model: model.toUpperCase(),
    value,
  }))

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6 bg-card/80 border-2 overflow-hidden">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground">Machine learning forecast</h3>
              <p className="text-sm text-muted-foreground">
                Ensemble breakdown for {new Date(summary.prediction_for).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>
                {summary.location.lat.toFixed(2)}, {summary.location.lon.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-3">
            <Card className="p-4 bg-primary/5 border-primary/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Ensemble precipitation</span>
                </div>
                <span className="text-xs uppercase tracking-wide text-primary/70">mm</span>
              </div>
              <div className="text-3xl font-semibold text-foreground">
                <AnimatedNumber value={summary.ml_precipitation_mm.prediction_mm} decimals={1} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ± <AnimatedNumber value={summary.ml_precipitation_mm.uncertainty_mm} decimals={1} /> mm (95% CI {summary.ml_precipitation_mm.confidence_interval_mm.lower.toFixed(1)} -
                {" "}
                {summary.ml_precipitation_mm.confidence_interval_mm.upper.toFixed(1)} mm)
              </p>
              <div className="mt-4 space-y-2">
                {precipitationModels.map((model, index) => (
                  <div key={model.model} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>{model.model}</span>
                      <span>{model.value.toFixed(1)} mm</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(Math.max((model.value / Math.max(summary.ml_precipitation_mm.confidence_interval_mm.upper, 1)) * 100, 4), 100)}%`,
                          backgroundColor: precipitationColors[index % precipitationColors.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-secondary/5 border-secondary/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-secondary" />
                  <span className="text-sm font-medium text-secondary">Rain probability</span>
                </div>
                <span className="text-xs uppercase tracking-wide text-secondary/70">confidence</span>
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="60%"
                    data={[{ name: "probability", value: probabilityPercent, fill: probabilityColors[0] }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={8} background fill={probabilityColors[1]} animationDuration={800} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-3xl font-semibold text-foreground text-center">
                <AnimatedNumber value={probabilityPercent} decimals={1} />%
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1 capitalize">
                {summary.ml_rain_probability.confidence_level} confidence • ±{summary.ml_rain_probability.uncertainty.toFixed(2)}
              </p>
            </Card>

            <Card className="p-4 bg-accent/5 border-accent/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-accent-foreground">Model agreement</span>
                <span className="text-xs text-muted-foreground">classification</span>
              </div>
              <div className="space-y-3">
                {probabilityModels.map((model) => (
                  <div key={model.model} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>{model.model}</span>
                      <span>{formatPercent(model.value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all duration-700"
                        style={{ width: `${Math.max(model.value * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-foreground mb-4">Regression ensemble weights</h4>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regressionWeights}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="model" axisLine={false} tickLine={false} stroke="currentColor" />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                      contentStyle={{ background: "hsl(var(--card))", borderRadius: 12, border: "1px solid hsl(var(--border))" }}
                      formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Weight"]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={700}>
                      {regressionWeights.map((entry, index) => (
                        <Cell key={entry.model} fill={precipitationColors[index % precipitationColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="text-sm font-semibold text-foreground mb-4">Classification ensemble weights</h4>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classificationWeights}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="model" axisLine={false} tickLine={false} stroke="currentColor" />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                      contentStyle={{ background: "hsl(var(--card))", borderRadius: 12, border: "1px solid hsl(var(--border))" }}
                      formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Weight"]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={700}>
                      {classificationWeights.map((entry, index) => (
                        <Cell key={entry.model} fill={weightColors[index % weightColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  )
}
