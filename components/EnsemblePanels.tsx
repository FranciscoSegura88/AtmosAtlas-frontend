// components/EnsemblePanels.tsx
"use client"

import { STR } from "@/lib/strings"
import { fmtNumber, fmtPercent } from "@/lib/format"

function WeightBars({ weights }: { weights?: Record<string, number> }) {
  const entries = Object.entries(weights ?? {})
  const sum = entries.reduce((a, [, v]) => a + (Number(v) || 0), 0) || 1
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => {
        const w = (Number(v) || 0) / sum
        return (
          <div key={k} className="flex items-center gap-2">
            <div className="w-24 text-xs uppercase text-muted-foreground">{k}</div>
            <div className="flex-1 h-2 bg-muted rounded">
              <div className="h-2 bg-primary rounded" style={{ width: `${(w * 100).toFixed(0)}%` }} />
            </div>
            <div className="w-12 text-right tabular-nums">{fmtPercent(w, 0)}</div>
          </div>
        )
      })}
    </div>
  )
}

export function EnsemblePanels({ data }: { data: any }) {
  if (!data?.backendSummary) return null

  const sum = data.backendSummary
  const rich = data.backendSummaryRich

  // choose probability: final weighted if available, else advanced fused
  const pFinal = Number(rich?.probabilities?.final_weighted)
  const pAdv = Number(sum?.ml_rain_probability?.probability)
  const usedP = Number.isFinite(pFinal) ? pFinal : pAdv
  const conf =
    String(rich?.probabilities?.final_confidence ??
      sum?.ml_rain_probability?.confidence_level ?? "medium")

  const ci = sum?.ml_precipitation_mm?.confidence_interval_mm

  const indivReg = sum?.ml_precipitation_mm?.individual_predictions_mm ?? {}

  return (
    <div className="grid gap-6">
      {/* Ensemble precipitation */}
      <div>
        <div className="font-medium">{STR.ensemblePrecip}</div>
        <div className="text-xl font-semibold">
          {fmtNumber(sum?.ml_precipitation_mm?.prediction_mm, 1)} mm
        </div>
        <div className="text-xs text-muted-foreground">
          ± {fmtNumber(sum?.ml_precipitation_mm?.uncertainty_mm, 1)} mm
          {ci ? ` (95% CI ${fmtNumber(ci.lower, 1)} - ${fmtNumber(ci.upper, 1)} mm)` : ""}
        </div>

        {/* Individual regression models */}
        <ul className="mt-3 text-sm space-y-1">
          {Object.entries(indivReg).map(([model, val]) => (
            <li key={model} className="flex justify-between">
              <span className="uppercase text-xs text-muted-foreground">{model}</span>
              <span className="tabular-nums">{fmtNumber(val, 1)} mm</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Rain probability */}
      <div>
        <div className="font-medium">{STR.rainProb}</div>
        <div className="text-xl font-semibold">{fmtPercent(usedP, 1)}</div>
        <div className="text-xs text-muted-foreground">{STR.confidence}: {conf}</div>
      </div>

      {/* Ensemble weights */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="font-medium">{STR.regWeights}</div>
          <WeightBars weights={sum?.ml_precipitation_mm?.ensemble_weights_reg} />
        </div>
        <div>
          <div className="font-medium">{STR.clsWeights}</div>
          <WeightBars weights={sum?.ml_rain_probability?.ensemble_weights_cls} />
        </div>
      </div>
    </div>
  )
}
