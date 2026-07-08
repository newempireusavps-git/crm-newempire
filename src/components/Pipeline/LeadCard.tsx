import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Mail, Phone, DollarSign, Wifi, Eye } from 'lucide-react'
import type { Lead } from '@/types/lead'
import { CHANNEL_LABELS } from '@/types/lead'
import { formatCurrency, formatDate } from '@/lib/utils'

interface LeadCardProps {
  lead: Lead
  onViewDetails: (lead: Lead) => void
}

const priorityDot: Record<string, string> = {
  Hot:  'bg-red-500',
  Warm: 'bg-yellow-400',
  Cold: 'bg-blue-400',
}

export function LeadCard({ lead, onViewDetails }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const fullName = `${lead.first_name} ${lead.last_name}`.trim()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-empire-navy border border-empire-border rounded-lg p-3 cursor-grab active:cursor-grabbing select-none hover:border-empire-gold/40 transition-colors"
    >
      <div {...attributes} {...listeners}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-white text-sm font-semibold leading-tight">{fullName || '—'}</h4>
          <div
            className={`w-2 h-2 rounded-full shrink-0 mt-1 ${priorityDot[lead.priority] ?? 'bg-gray-500'}`}
            title={lead.priority}
          />
        </div>

        <div className="space-y-1.5 text-xs text-gray-400">
          {lead.email && (
            <div className="flex items-center gap-1.5">
              <Mail size={11} className="shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={11} className="shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
          {(lead.estimated_project_value ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-empire-gold">
              <DollarSign size={11} className="shrink-0" />
              <span className="font-medium">{formatCurrency(lead.estimated_project_value ?? 0)}</span>
            </div>
          )}
          {lead.channel && (
            <div className="flex items-center gap-1.5">
              <Wifi size={11} className="shrink-0" />
              <span className="truncate">{CHANNEL_LABELS[lead.channel] ?? lead.channel}</span>
            </div>
          )}
          {lead.service_type && lead.service_type !== 'Unknown' && (
            <p className="text-gray-500 text-xs mt-1 line-clamp-1">{lead.service_type}</p>
          )}
        </div>

        <div className="mt-2 text-gray-600 text-xs">{formatDate(lead.created_at)}</div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onViewDetails(lead) }}
        className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-empire-gold hover:text-yellow-300 border border-empire-gold/30 hover:border-empire-gold/60 rounded py-1 transition-colors"
      >
        <Eye size={11} />
        Detalhes
      </button>
    </div>
  )
}
