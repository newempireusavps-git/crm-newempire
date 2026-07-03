import { useFilters } from '@/context/FilterContext'
import type { Lead, FilterPeriodo } from '@/types/lead'

interface GlobalFiltersProps {
  leads: Lead[]
}

const periodos: { value: FilterPeriodo; label: string }[] = [
  { value: 'todos',  label: 'Todos' },
  { value: 'hoje',   label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes',    label: 'Mês' },
]

export function GlobalFilters({ leads }: GlobalFiltersProps) {
  const { filters, setFilters } = useFilters()

  const channels = ['todos', ...Array.from(new Set(leads.map((l) => l.channel).filter(Boolean)))]

  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-empire-navy border-b border-empire-border">
      <span className="text-gray-400 text-sm font-medium">Filtros:</span>

      {/* Período */}
      <div className="flex items-center gap-1 rounded-lg bg-empire-card border border-empire-border p-1">
        {periodos.map((p) => (
          <button
            key={p.value}
            onClick={() => setFilters((f) => ({ ...f, periodo: p.value }))}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filters.periodo === p.value
                ? 'bg-empire-gold text-empire-dark'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Canal */}
      <select
        value={filters.channel}
        onChange={(e) => setFilters((f) => ({ ...f, channel: e.target.value }))}
        className="bg-empire-card border border-empire-border text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-empire-gold"
      >
        {channels.map((c) => (
          <option key={c} value={c}>
            {c === 'todos' ? 'Todos os canais' : c}
          </option>
        ))}
      </select>
    </div>
  )
}
