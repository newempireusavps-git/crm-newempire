import { useState, useMemo } from 'react'
import { Download, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import type { Lead } from '@/types/lead'
import { PIPELINE_STAGES } from '@/types/lead'
import { LeadModal } from '@/components/Pipeline/LeadModal'
import { formatDate } from '@/lib/utils'

interface LeadsPageProps {
  leads: Lead[]
  loading: boolean
}

const CHANNEL_COLORS: Record<string, string> = {
  chat:      'text-purple-400 bg-purple-400/10 border-purple-400/30',
  whatsapp:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  instagram: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
  facebook:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
}

const PRIORITY_COLORS: Record<string, string> = {
  Hot:  'text-red-400 bg-red-400/10 border-red-400/30',
  Warm: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  Cold: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
}

function getChannelColor(ch: string) {
  return CHANNEL_COLORS[ch.toLowerCase()] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/30'
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center text-xs border rounded-full px-2 py-0.5 font-medium capitalize ${className}`}>
      {label}
    </span>
  )
}

const PAGE_SIZE = 20

export function LeadsPage({ leads, loading }: LeadsPageProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterChannel, setFilterChannel] = useState('todos')
  const [filterService, setFilterService] = useState('todos')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [page, setPage] = useState(1)

  const channels = useMemo(() => {
    const set = new Set(leads.map((l) => l.channel).filter(Boolean))
    return Array.from(set).sort()
  }, [leads])

  const services = useMemo(() => {
    const set = new Set(leads.map((l) => l.service_type).filter((s) => s && s !== 'Unknown'))
    return Array.from(set).sort()
  }, [leads])

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const name = `${l.first_name} ${l.last_name}`.toLowerCase()
      if (search && !name.includes(search.toLowerCase()) && !(l.email ?? '').toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus !== 'todos' && l.status !== filterStatus) return false
      if (filterChannel !== 'todos' && l.channel !== filterChannel) return false
      if (filterService !== 'todos' && l.service_type !== filterService) return false
      return true
    })
  }, [leads, search, filterStatus, filterChannel, filterService])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const reset = () => setPage(1)

  function exportCSV() {
    const headers = ['Nome', 'Email', 'Telefone', 'Canal', 'Status', 'Serviço', 'Score', 'Data']
    const rows = filtered.map((l) => [
      `${l.first_name} ${l.last_name}`,
      l.email ?? '',
      l.phone,
      l.channel,
      l.status,
      l.service_type,
      String(l.lead_score),
      formatDate(l.created_at),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'leads.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const selectClass =
    'bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 min-w-[140px]'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-empire-muted text-sm mt-0.5">
            {loading
              ? 'Carregando…'
              : `${filtered.length === leads.length ? filtered.length : `${filtered.length} de ${leads.length}`} leads`}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-empire-card border border-empire-border rounded-xl p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-empire-muted" />
          <input
            type="text"
            placeholder="Buscar por nome ou email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); reset() }}
            className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-empire-muted"
          />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); reset() }} className={selectClass}>
          <option value="todos">Todos os status</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s.status} value={s.status}>{s.label}</option>
          ))}
        </select>
        <select value={filterChannel} onChange={(e) => { setFilterChannel(e.target.value); reset() }} className={selectClass}>
          <option value="todos">Todos os canais</option>
          {channels.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterService} onChange={(e) => { setFilterService(e.target.value); reset() }} className={selectClass}>
          <option value="todos">Todos os serviços</option>
          {services.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-empire-muted text-sm">Carregando leads…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-4xl">🔍</span>
            <p className="text-white font-medium">Nenhum lead encontrado</p>
            <p className="text-empire-muted text-sm">Ajuste os filtros acima.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-empire-border text-left">
                    {['Nome', 'Canal', 'Status', 'Serviço', 'Score', 'Data'].map((h) => (
                      <th key={h} className="px-4 py-3 text-empire-muted font-medium text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((lead, i) => (
                    <tr
                      key={lead.id}
                      className={`border-b border-empire-border/50 hover:bg-empire-gold/5 cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-empire-navy/20' : ''}`}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-empire-gold font-medium hover:underline">
                          {`${lead.first_name} ${lead.last_name}`.trim() || '—'}
                        </p>
                        {lead.email && <p className="text-gray-500 text-xs">{lead.email}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={lead.channel} className={getChannelColor(lead.channel)} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-300">{lead.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {lead.service_type !== 'Unknown' ? lead.service_type : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${PRIORITY_COLORS[lead.priority] ? 'text-empire-gold' : 'text-gray-400'}`}>
                          {lead.lead_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                        {formatDate(lead.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-empire-border">
                <p className="text-empire-muted text-sm">Página {safePage} de {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-empire-navy border border-empire-border text-sm text-white hover:border-empire-gold/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={15} /> Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-empire-navy border border-empire-border text-sm text-white hover:border-empire-gold/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Próximo <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  )
}
