import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Lead } from '@/types/lead'
import { TrendingUp, Award, Calendar } from 'lucide-react'

interface InsightsPanelProps {
  leads: Lead[]
}

function getWeekLabel(date: Date): string {
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  return fmt(date)
}

export function InsightsPanel({ leads }: InsightsPanelProps) {
  // Leads per week (last 8 weeks)
  const weeks: { label: string; start: Date; end: Date }[] = []
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now)
    start.setDate(now.getDate() - i * 7 - 6)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    weeks.push({ label: getWeekLabel(start), start, end })
  }

  const weeklyData = weeks.map((w) => {
    const count = leads.filter((l) => {
      const d = new Date(l.created_at)
      return d >= w.start && d <= w.end
    }).length
    return { name: w.label, leads: count }
  })

  // Hot leads rate
  const total = leads.length
  const hot = leads.filter((l) => l.priority === 'Hot').length
  const taxaMedia = total > 0 ? Math.round((hot / total) * 100) : 0

  // Best channel by lead count
  const channels = Array.from(new Set(leads.map((l) => l.channel).filter(Boolean)))
  const origemStats = channels
    .map((o) => {
      const all = leads.filter((l) => l.channel === o)
      const hotCount = all.filter((l) => l.priority === 'Hot').length
      return {
        origem: o,
        total: all.length,
        qualificados: hotCount,
        taxa: all.length > 0 ? Math.round((hotCount / all.length) * 100) : 0,
      }
    })
    .sort((a, b) => b.taxa - a.taxa)

  const bestOrigem = origemStats[0]

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-empire-card border border-empire-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Calendar size={18} className="text-empire-gold" />
            <span className="text-gray-400 text-sm">Leads esta semana</span>
          </div>
          <p className="text-white text-3xl font-bold">
            {weeklyData[weeklyData.length - 1]?.leads ?? 0}
          </p>
        </div>

        <div className="bg-empire-card border border-empire-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp size={18} className="text-green-400" />
            <span className="text-gray-400 text-sm">Taxa de leads quentes</span>
          </div>
          <p className="text-white text-3xl font-bold">{taxaMedia}%</p>
        </div>

        <div className="bg-empire-card border border-empire-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Award size={18} className="text-purple-400" />
            <span className="text-gray-400 text-sm">Melhor canal</span>
          </div>
          {bestOrigem ? (
            <div>
              <p className="text-white text-lg font-bold">{bestOrigem.origem}</p>
              <p className="text-gray-400 text-sm">{bestOrigem.taxa}% conversão</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Sem dados</p>
          )}
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-empire-card border border-empire-border rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Leads por Semana (últimas 8 semanas)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
            <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#16213e',
                border: '1px solid #2a2a4a',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
            />
            <Bar dataKey="leads" name="Leads" fill="#FFD700" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Origem table */}
      {origemStats.length > 0 && (
        <div className="bg-empire-card border border-empire-border rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Leads por Canal</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-empire-border">
                  <th className="text-left text-gray-400 pb-2 font-medium">Origem</th>
                  <th className="text-right text-gray-400 pb-2 font-medium">Total</th>
                  <th className="text-right text-gray-400 pb-2 font-medium">Qualificados</th>
                  <th className="text-right text-gray-400 pb-2 font-medium">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-empire-border">
                {origemStats.map((o) => (
                  <tr key={o.origem} className="hover:bg-empire-navy/50">
                    <td className="py-2 text-white">{o.origem}</td>
                    <td className="py-2 text-right text-gray-400">{o.total}</td>
                    <td className="py-2 text-right text-green-400">{o.qualificados}</td>
                    <td className="py-2 text-right">
                      <span
                        className={`font-semibold ${o.taxa >= 50 ? 'text-green-400' : o.taxa >= 25 ? 'text-yellow-400' : 'text-red-400'}`}
                      >
                        {o.taxa}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
