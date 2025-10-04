"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateSelectorProps {
  onDateChange: (date: Date) => void
}

export function DateSelector({ onDateChange }: DateSelectorProps) {
  const currentYear = new Date().getFullYear()
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const handleDateChange = (day?: number, month?: number, year?: number) => {
    const newDay = day ?? selectedDay
    const newMonth = month ?? selectedMonth
    const newYear = year ?? selectedYear

    const daysInMonth = getDaysInMonth(newMonth, newYear)
    const validDay = Math.min(newDay, daysInMonth)

    setSelectedDay(validDay)
    setSelectedMonth(newMonth)
    setSelectedYear(newYear)

    const newDate = new Date(newYear, newMonth, validDay)
    onDateChange(newDate)
  }

  return (
    <div className="p-4 bg-card/90 backdrop-blur-xl border-2 border-primary/50 rounded-lg shadow-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <CalendarIcon className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Fecha de Proyección</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Día</label>
          <Select
            value={selectedDay.toString()}
            onValueChange={(value) => handleDateChange(Number.parseInt(value), undefined, undefined)}
          >
            <SelectTrigger className="bg-background/50 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Mes</label>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => handleDateChange(undefined, Number.parseInt(value), undefined)}
          >
            <SelectTrigger className="bg-background/50 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Año</label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => handleDateChange(undefined, undefined, Number.parseInt(value))}
          >
            <SelectTrigger className="bg-background/50 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {Array.from({ length: 100 }, (_, i) => currentYear + i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 p-2 bg-primary/10 rounded-md border border-primary/30">
        <p className="text-xs text-center font-semibold text-foreground">
          {selectedDay} de {months[selectedMonth]} de {selectedYear}
        </p>
      </div>
    </div>
  )
}
