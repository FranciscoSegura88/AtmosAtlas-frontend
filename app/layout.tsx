import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "AtmosAtlas - Historical Climate Risk Intelligence",
  description: "Not a weather forecast, it's a forecast of the past. Analyze decades of NASA climate data to plan your future events with confidence.",
  generator: "AtmosAtlas",
  icons: {
    icon: '/atmosatlaslogobuscador.png',
    shortcut: '/atmosatlaslogobuscador.png',
    apple: '/atmosatlaslogobuscador.png',
  },
  openGraph: {
    title: "AtmosAtlas - Historical Climate Risk Intelligence",
    description: "Plan your outdoor events with confidence using 40+ years of NASA climate data",
    images: ['/atmosatlaslogo.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}