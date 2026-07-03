import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MetricCards } from '@/components/Dashboard/MetricCards'
import { LeadsChart } from '@/components/Charts/LeadsChart'
import { useFilters } from '@/context/FilterContext'
import type { Lead } from '@/types/lead'

interface DashboardPageProps {
  leads: Lead[]
  loading: boolean
  onRefresh: () => void
}

export function DashboardPage({ leads, loading, onRefresh }: DashboardPageProps) {
  const { applyFilters } = useFilters()
  const filtered = applyFilters(leads)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral dos seus leads</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </Button>
      </div>

      {/* Metric cards */}
      <MetricCards leads={filtered} />

      {/* Chart */}
      <LeadsChart leads={filtered} />
    </div>
  )
}
