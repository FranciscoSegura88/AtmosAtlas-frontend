// lib/format.ts
export function clamp01(x: number) {
  if (!Number.isFinite(Number(x))) return 0
  return Math.min(1, Math.max(0, Number(x)))
}

function fixNegZero(n: number) {
  return Object.is(n, -0) ? 0 : n
}

export function fmtNumber(n: any, digits = 1) {
  const v = Number(n)
  if (!Number.isFinite(v)) return "—"
  const r = Number(v.toFixed(digits))
  return fixNegZero(r).toFixed(digits)
}

export function fmtPercent(n: any, digits = 0) {
  return `${fmtNumber(clamp01(Number(n)) * 100, digits)}%`
}

export function fmtMaybe(n: any, unit = "", digits = 0) {
  const v = Number(n)
  if (!Number.isFinite(v)) return "—"
  const s = fmtNumber(v, digits)
  return unit ? `${s} ${unit}` : s
}

/** Format a 'YYYY-MM-DD' string as a local date like "December 10, 2025" */
export function fmtDateLocalYMD(ymd: string, locale = "en-US") {
  if (!ymd) return "—"
  const [y, m, d] = ymd.split("-").map(Number)
  if (!y || !m || !d) return ymd
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
}

/** Convert Date to 'YYYY-MM-DD' in local time */
export function toYMD(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
