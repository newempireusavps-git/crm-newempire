import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import type { Filters, FilterPeriodo, Lead } from '@/types/lead'

interface FilterContextValue {
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  applyFilters: (leads: Lead[]) => Lead[]
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>({
    periodo: 'todos',
    status: 'todos',
    channel: 'todos',
  })

  const applyFilters = useMemo(
    () =>
      (leads: Lead[]): Lead[] => {
        let result = [...leads]

        if (filters.periodo !== 'todos') {
          const start = new Date()
          if (filters.periodo === 'hoje') start.setHours(0, 0, 0, 0)
          else if (filters.periodo === 'semana') start.setDate(start.getDate() - 7)
          else if (filters.periodo === 'mes') start.setDate(start.getDate() - 30)
          result = result.filter((l) => new Date(l.created_at) >= start)
        }

        if (filters.status !== 'todos') {
          result = result.filter((l) => l.status === filters.status)
        }

        if (filters.channel && filters.channel !== 'todos') {
          result = result.filter((l) => l.channel === filters.channel)
        }

        return result
      },
    [filters],
  )

  return (
    <FilterContext.Provider value={{ filters, setFilters, applyFilters }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used inside FilterProvider')
  return ctx
}

export type { FilterPeriodo }
