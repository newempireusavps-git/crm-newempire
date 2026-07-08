import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { Lead } from '@/types/lead'

interface LeadsChartProps {
  leads: Lead[]
}

function getWeekLabel(date: Date): string {
  const start = new Date(date)
  const end = new Date(date)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  return `${fmt(start)}-${fmt(end)}`
}

export function LeadsChart({ leads }: LeadsChartProps) {
  // Build 5 weeks of data
  const weeks: { label: string; start: Date; end: Date }[] = []
  const now = new Date()
  for (let i = 4; i >= 0; i--) {
    const start = new Date(now)
    start.setDate(now.getDate() - i * 7 - 6)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    weeks.push({ label: getWeekLabel(start), start, end })
  }

  const chartData = weeks.map((w) => {
    const weekLeads = leads.filter((l) => {
      const d = new Date(l.created_at)
      return d >= w.start && d <= w.end
    })
    return {
      name: w.label,
      total: weekLeads.length,
      // "Qualificado" = progressed past initial qualification (chose an estimate path)
      qualificados: weekLeads.filter(
        (l) => !['New Lead', 'Qualificando', 'Lost'].includes(l.status),
      ).length,
      fechados: weekLeads.filter((l) => l.status === 'Qualified').length,
      desqualificados: weekLeads.filter((l) => l.status === 'Lost').length,
    }
  })

  return (
    <div className="bg-empire-card border border-empire-border rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Leads por Semana (últimas 5 semanas)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="#6b7280"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="qualificados"
            name="Qualificados"
            stroke="#FFD700"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="fechados"
            name="Fechados"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="desqualificados"
            name="Desqualificados"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
