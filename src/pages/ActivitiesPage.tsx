import { useState, useEffect } from 'react'
import { Clock, Mail, MessageSquare, Bell, FileText, ArrowRight, Megaphone } from 'lucide-react'
import { fetchAllActivities } from '@/lib/supabase'
import type { LeadActivity } from '@/types/lead'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const TYPE_CONFIG: Record<
  LeadActivity['type'],
  { icon: React.ReactNode; label: string; color: string }
> = {
  email:         { icon: <Mail size={14} />,          label: 'Email',          color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  chat:          { icon: <MessageSquare size={14} />,  label: 'Chat',           color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  followup:      { icon: <Bell size={14} />,           label: 'Follow-up',      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  note:          { icon: <FileText size={14} />,       label: 'Nota',           color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
  status_change: { icon: <ArrowRight size={14} />,     label: 'Status',         color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  campaign:      { icon: <Megaphone size={14} />,      label: 'Campanha',       color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
}

export function ActivitiesPage() {
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<LeadActivity['type'] | 'todos'>('todos')
  const [selected, setSelected] = useState<LeadActivity | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchAllActivities(100)
      .then(setActivities)
      .finally(() => setLoading(false))
  }, [])

  const filtered =
    filter === 'todos' ? activities : activities.filter((a) => a.type === filter)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-white text-2xl font-bold">Atividades</h1>
        <p className="text-gray-500 text-sm mt-1">
          Feed global de todas as interações com leads.
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(['todos', 'email', 'chat', 'followup', 'note', 'status_change', 'campaign'] as const).map((type) => {
          const isAll = type === 'todos'
          const config = isAll ? null : TYPE_CONFIG[type]
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                filter === type
                  ? 'bg-empire-gold/20 text-empire-gold border-empire-gold/40'
                  : 'text-gray-400 border-empire-border hover:text-white hover:border-gray-500'
              }`}
            >
              {config?.icon}
              {isAll ? 'Todos' : config?.label}
            </button>
          )
        })}
      </div>

      {/* Feed */}
      <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-empire-muted text-sm">
            Carregando atividades…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Clock size={40} className="text-empire-muted" />
            <p className="text-white font-medium">Nenhuma atividade</p>
            <p className="text-empire-muted text-sm text-center max-w-xs">
              As interações dos leads aparecerão aqui conforme o sistema processa conversas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-empire-border">
            {filtered.map((act) => {
              const config = TYPE_CONFIG[act.type]
              return (
                <button
                  key={act.id}
                  onClick={() => setSelected(act)}
                  className="w-full text-left px-5 py-4 hover:bg-empire-navy/30 transition-colors flex items-start gap-4"
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white text-sm font-medium leading-tight">{act.title}</p>
                      <span className={`text-xs border rounded-full px-2 py-0.5 shrink-0 ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    {act.description && (
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">{act.description}</p>
                    )}
                    <p className="text-gray-600 text-xs mt-1.5">{formatDate(act.created_at)}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
          {selected && (
            <>
              <DialogHeader className="shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 ${TYPE_CONFIG[selected.type].color}`}>
                    {TYPE_CONFIG[selected.type].icon}
                  </div>
                  <div>
                    <DialogTitle>{selected.title}</DialogTitle>
                    <p className="text-empire-muted text-xs mt-0.5">{formatDate(selected.created_at)}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="overflow-y-auto space-y-4">
                {selected.description && (
                  <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {selected.description}
                  </p>
                )}
                {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                  <div className="border-t border-empire-border pt-3 space-y-1.5">
                    {Object.entries(selected.metadata).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2 text-xs">
                        <span className="text-empire-muted shrink-0 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-gray-300 break-words">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
