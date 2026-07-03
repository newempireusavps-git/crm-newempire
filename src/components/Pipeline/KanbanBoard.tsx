import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Lead } from '@/types/lead'
import { PIPELINE_STAGES } from '@/types/lead'
import { updateLeadStatus } from '@/lib/supabase'
import { KanbanColumn } from './KanbanColumn'
import { LeadCard } from './LeadCard'
import { LeadModal } from './LeadModal'

interface KanbanBoardProps {
  leads: Lead[]
  onLeadsChange: (leads: Lead[]) => void
}

export function KanbanBoard({ leads, onLeadsChange }: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveLead(leads.find((l) => l.id === event.active.id) ?? null)
    },
    [leads],
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveLead(null)
      const { active, over } = event
      if (!over) return

      const draggedLead = leads.find((l) => l.id === active.id)
      if (!draggedLead) return

      const stageKeys = PIPELINE_STAGES.map((s) => s.status) as string[]
      let targetStatus: string | null = null

      if (stageKeys.includes(over.id as string)) {
        targetStatus = over.id as string
      } else {
        const targetLead = leads.find((l) => l.id === over.id)
        if (targetLead) targetStatus = targetLead.status
      }

      if (!targetStatus || targetStatus === draggedLead.status) return

      const updated = leads.map((l) =>
        l.id === draggedLead.id ? { ...l, status: targetStatus as string } : l,
      )
      onLeadsChange(updated)

      try {
        await updateLeadStatus(draggedLead.id, targetStatus)
      } catch {
        onLeadsChange(leads)
      }
    },
    [leads, onLeadsChange],
  )

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={(e) => void handleDragEnd(e)}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              label={col.label}
              color={col.color}
              leads={leads.filter((l) => l.status === col.status)}
              onViewDetails={setSelectedLead}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="rotate-3 opacity-90">
              <LeadCard lead={activeLead} onViewDetails={() => undefined} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </>
  )
}
