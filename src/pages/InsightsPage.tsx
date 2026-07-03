import { InsightsPanel } from '@/components/Insights/InsightsPanel'
import { useFilters } from '@/context/FilterContext'
import type { Lead } from '@/types/lead'

interface InsightsPageProps {
  leads: Lead[]
}

export function InsightsPage({ leads }: InsightsPageProps) {
  const { applyFilters } = useFilters()
  const filtered = applyFilters(leads)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white text-2xl font-bold">Insights</h1>
        <p className="text-gray-500 text-sm mt-1">Análise de performance dos seus leads</p>
      </div>
      <InsightsPanel leads={filtered} />
    </div>
  )
}
