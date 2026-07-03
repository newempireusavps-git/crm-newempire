import { KanbanBoard } from '@/components/Pipeline/KanbanBoard'
import { useFilters } from '@/context/FilterContext'
import type { Lead } from '@/types/lead'

interface PipelinePageProps {
  leads: Lead[]
  onLeadsChange: (leads: Lead[]) => void
}

export function PipelinePage({ leads, onLeadsChange }: PipelinePageProps) {
  const { applyFilters } = useFilters()
  const filtered = applyFilters(leads)

  // Merge filtered leads with full leads to maintain unfiltered cards in other columns
  // but only show filtered ones
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white text-2xl font-bold">Pipeline</h1>
        <p className="text-gray-500 text-sm mt-1">
          Arraste os cards para mover leads entre etapas
        </p>
      </div>

      <KanbanBoard leads={filtered} onLeadsChange={onLeadsChange} />
    </div>
  )
}
