import { Users, TrendingUp, Star, Layers, Flame, CheckCircle2 } from 'lucide-react'
import type { Lead } from '@/types/lead'
import { PIPELINE_STAGES } from '@/types/lead'

interface MetricCardsProps {
  leads: Lead[]
}

export function MetricCards({ leads }: MetricCardsProps) {
  const total = leads.length
  const hot = leads.filter((l) => l.priority === 'Hot').length
  const fechados = leads.filter((l) => l.status === 'Qualified').length
  const avgScore = total > 0 ? Math.round(leads.reduce((s, l) => s + l.lead_score, 0) / total) : 0

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const newThisWeek = leads.filter((l) => new Date(l.created_at) >= oneWeekAgo).length

  const withEmail = leads.filter((l) => l.email).length
  const contactRate = total > 0 ? Math.round((withEmail / total) * 100) : 0

  const cards = [
    { label: 'Total de Leads',     value: total,          icon: <Users size={22} />,     color: 'text-blue-400',   border: 'border-blue-500/30' },
    { label: 'Leads Quentes',      value: hot,            icon: <Flame size={22} />,     color: 'text-red-400',    border: 'border-red-500/30' },
    { label: 'Fechados',           value: fechados,       icon: <CheckCircle2 size={22} />, color: 'text-green-400', border: 'border-green-500/30' },
    { label: 'Novos esta semana',  value: newThisWeek,    icon: <Star size={22} />,      color: 'text-purple-400', border: 'border-purple-500/30' },
    { label: 'Score médio',        value: avgScore,       icon: <TrendingUp size={22} />,color: 'text-empire-gold',border: 'border-empire-gold/30' },
    { label: 'Com contato',        value: `${contactRate}%`, icon: <Users size={22} />, color: 'text-green-400',   border: 'border-green-500/30' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-empire-card border ${card.border} rounded-xl p-5 flex items-center gap-4`}
          >
            <div className={`${card.color} p-3 bg-empire-navy rounded-lg`}>{card.icon}</div>
            <div>
              <p className="text-gray-400 text-sm">{card.label}</p>
              <p className="text-white text-2xl font-bold mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-empire-card border border-empire-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={16} className="text-empire-gold" />
          <h3 className="text-white text-sm font-semibold">Leads por Estágio do Funil</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {PIPELINE_STAGES.map(({ status, label }) => {
            const count = leads.filter((l) => l.status === status).length
            return (
              <div key={status} className="bg-empire-navy border border-empire-border rounded-lg p-3 text-center">
                <p className="text-white text-xl font-bold">{count}</p>
                <p className="text-gray-400 text-xs mt-1">{label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
