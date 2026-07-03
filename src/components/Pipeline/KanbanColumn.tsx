import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Lead } from '@/types/lead'
import { LeadCard } from './LeadCard'

interface KanbanColumnProps {
  status: string
  label: string
  color: string
  leads: Lead[]
  onViewDetails: (lead: Lead) => void
}

export function KanbanColumn({ status, label, color, leads, onViewDetails }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      className={`flex flex-col min-w-[220px] max-w-[260px] flex-1 bg-empire-card border border-empire-border rounded-xl border-t-2 ${color} transition-colors ${isOver ? 'bg-empire-navy' : ''}`}
    >
      <div className="px-3 py-3 border-b border-empire-border">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-sm font-semibold">{label}</h3>
          <span className="text-xs bg-empire-navy text-gray-400 rounded-full px-2 py-0.5 border border-empire-border">
            {leads.length}
          </span>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto">
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onViewDetails={onViewDetails} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex items-center justify-center h-24 text-gray-600 text-xs border border-dashed border-empire-border rounded-lg">
            Nenhum lead
          </div>
        )}
      </div>
    </div>
  )
}
