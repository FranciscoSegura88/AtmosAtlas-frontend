"use client"

import { Card } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/animated-number"
import type { BackendSummary, ConditionRisk } from "@/types/weather"
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
import { fmtDateLocalYMD, fmtNumber, fmtPercent, clamp01 } from "@/lib/format"

interface BackendForecastInsightsProps {
  summary: BackendSummary
  riskScores?: ConditionRisk[]
  finalWeighted?: number
  finalConfidence?: string
}

const probabilityColors = ["#38bdf8", "#1e40af"]
const precipitationColors = ["#22c55e", "#16a34a", "#15803d", "#0f766e", "#0ea5e9", "#1d4ed8"]
const weightColors = ["#fb7185", "#f97316", "#facc15", "#34d399", "#38bdf8"]

export function BackendForecastInsights({ summary, riskScores, finalWeighted, finalConfidence }: BackendForecastInsightsProps) {
  const usedP = Number.isFinite(Number(finalWeighted))
    ? Number(finalWeighted)
    : Number(summary?.ml_rain_probability?.probability ?? 0)

  const confidence = String(finalConfidence ?? summary?.ml_rain_probability?.confidence_level ?? "medium")

  const radialData = [{ name: "rain", value: Math.round(clamp01(usedP) * 100) }]

  const ind = summary?.ml_precipitation_mm?.individual_predictions_mm ?? {}
  const regData = Object.keys(ind).map((k) => {
    const raw = Number(ind[k] ?? 0)
    const mm = Math.max(0, Number.isFinite(raw) ? raw : 0)
    const pretty = Number(fmtNumber(mm, 2)) // esto evita "-0.0"
    return { name: k.toUpperCase(), mm: pretty }
  })

  const wReg = summary?.ml_precipitation_mm?.ensemble_weights_reg ?? {}
  const wCls = summary?.ml_rain_probability?.ensemble_weights_cls ?? {}
  const weightsReg = Object.keys(wReg).map((k) => ({ name: k.toUpperCase(), w: Number(wReg[k] ?? 0) }))
  const weightsCls = Object.keys(wCls).map((k) => ({ name: k.toUpperCase(), w: Number(wCls[k] ?? 0) }))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Machine learning forecast</h3>
        <p className="text-sm text-muted-foreground">
          Ensemble breakdown for {fmtDateLocalYMD(summary?.prediction_for)}
        </p>
      </div>

      {/* Probability radial */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Rain probability</p>
            <div className="text-3xl font-bold">
              <AnimatedNumber value={radialData[0].value} />%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Confidence: {confidence}</p>
          </div>
          <div className="w-40 h-40">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={10} fill={probabilityColors[0]} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Individual regression models (mm) */}
      <Card className="p-4">
        <p className="text-sm text-muted-foreground mb-2">Ensemble precipitation</p>
        <div className="w-full h-48">
          <ResponsiveContainer>
            <BarChart data={regData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <Tooltip />
              <Bar dataKey="mm">
                {regData.map((_, i) => (
                  <Cell key={i} fill={precipitationColors[i % precipitationColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          95% CI: {fmtNumber(summary?.ml_precipitation_mm?.confidence_interval_mm?.lower, 2)} –
          {` `}{fmtNumber(summary?.ml_precipitation_mm?.confidence_interval_mm?.upper, 2)} mm •
          Uncertainty ±{fmtNumber(summary?.ml_precipitation_mm?.uncertainty_mm, 2)} mm
        </p>
      </Card>

      {/* Weights (reg + cls) */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-2">Regression ensemble weights</p>
          <div className="w-full h-44">
            <ResponsiveContainer>
              <BarChart data={weightsReg}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <Tooltip />
                <Bar dataKey="w">
                  {weightsReg.map((_, i) => (
                    <Cell key={i} fill={weightColors[i % weightColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-2">Classification ensemble weights</p>
          <div className="w-full h-44">
            <ResponsiveContainer>
              <BarChart data={weightsCls}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <Tooltip />
                <Bar dataKey="w">
                  {weightsCls.map((_, i) => (
                    <Cell key={i} fill={weightColors[i % weightColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Risks */}
      {Array.isArray(riskScores) && riskScores.length > 0 && (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-3">Condition risk outlook</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {riskScores.map((r) => (
              <div key={r.id} className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">{r.label}</div>
                <div className="text-xl font-semibold">{fmtPercent(r.probability, 0)}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
