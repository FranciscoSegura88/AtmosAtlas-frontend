// lib/format.ts
export function fmtNumber(n: any, digits = 1): string {
  const v = Number(n)
  if (!Number.isFinite(v)) return "—"
  const z = Math.abs(v) < 1e-12 ? 0 : v
  return z.toFixed(digits)
}

export function fmtPercent(n: any, digits = 1): string {
  const v = Number(n)
  if (!Number.isFinite(v)) return "—"
  return `${(v * 100).toFixed(digits)}%`
}

export function fmtMaybe(n: any, unit = "", digits = 0): string {
  const v = Number(n)
  if (!Number.isFinite(v)) return "—"
  return `${v.toFixed(digits)}${unit}`
}

export function fmtDateISO(iso?: string, locale = "en-US"): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.valueOf())) return iso
  return d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
}
