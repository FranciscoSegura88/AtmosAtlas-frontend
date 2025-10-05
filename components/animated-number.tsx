"use client"

import { useEffect, useRef, useState } from "react"

interface AnimatedNumberProps {
  value: number
  decimals?: number
  durationMs?: number
}

export function AnimatedNumber({ value, decimals = 0, durationMs = 800 }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const previousValue = useRef(value)

  useEffect(() => {
    const start = previousValue.current
    const diff = value - start
    const startTime = performance.now()
    let frameId: number

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / durationMs, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(start + diff * easedProgress)
      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }

    frameId = requestAnimationFrame(animate)
    previousValue.current = value

    return () => cancelAnimationFrame(frameId)
  }, [value, durationMs])

  return <span>{displayValue.toFixed(decimals)}</span>
}
