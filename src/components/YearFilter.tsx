"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface YearFilterProps {
  selectedYear: number
  availableYears: number[]
  onYearChange: (year: number) => void
  className?: string
}

export default function YearFilter({
  selectedYear,
  availableYears,
  onYearChange,
  className
}: YearFilterProps) {
  const handleValueChange = (value: string) => {
    onYearChange(parseInt(value, 10))
  }

  // Sort years in descending order (most recent first)
  const sortedYears = [...availableYears].sort((a, b) => b - a)

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Year:</span>
        <Select
          value={selectedYear.toString()}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {sortedYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}