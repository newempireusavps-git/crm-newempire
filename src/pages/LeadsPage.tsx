import { useState, useMemo } from 'react'
import { Download, ChevronLeft, ChevronRight, Search, Plus, X, Loader2 } from 'lucide-react'
import type { Lead } from '@/types/lead'
import { PIPELINE_STAGES } from '@/types/lead'
import { LeadModal } from '@/components/Pipeline/LeadModal'
import { formatDate } from '@/lib/utils'
import { createLead } from '@/lib/supabase'

interface LeadsPageProps {
  leads: Lead[]
  loading: boolean
  onLeadAdded?: (lead: Lead) => void
}

const CHANNEL_COLORS: Record<string, string> = {
  chat:      'text-purple-400 bg-purple-400/10 border-purple-400/30',
  whatsapp:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  instagram: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
  facebook:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
  sms:       'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  manual:    'text-gray-400 bg-gray-400/10 border-gray-400/30',
}

const SERVICE_TYPES = [
  'Cabinet Painting',
  'Cabinet Refinishing',
  'Kitchen Remodeling',
  'Bathroom Remodeling',
  'Full Home Remodeling',
  'Flooring',
  'Other',
]

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center text-xs border rounded-full px-2 py-0.5 font-medium capitalize ${className}`}>
      {label}
    </span>
  )
}

// ─── New Lead Modal ───────────────────────────────────────────────────────────
function NewLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (l: Lead) => void }) {
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [phone, setPhone]           = useState('')
  const [email, setEmail]           = useState('')
  const [channel, setChannel]       = useState('manual')
  const [serviceType, setServiceType] = useState('Cabinet Painting')
  const [status, setStatus]         = useState('New Lead')
  const [address, setAddress]             = useState('')
  const [city, setCity]                   = useState('')
  const [facebookPsid, setFacebookPsid]   = useState('')
  const [instagramId, setInstagramId]     = useState('')
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim()) { setError('Nome obrigatório'); return }
    if (!phone.trim())     { setError('Telefone obrigatório'); return }
    setSaving(true); setError('')
    try {
      const lead = await createLead({
        first_name:           firstName.trim(),
        last_name:            lastName.trim(),
        phone:                phone.trim(),
        email:                email.trim() || null,
        channel,
        service_type:         serviceType,
        status,
        property_address:     address.trim() || null,
        city:                 city.trim() || null,
        source:               'Manual',
        facebook_psid:        facebookPsid.trim() || null,
        instagram_scoped_id:  instagramId.trim() || null,
      })
      onCreated(lead)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar lead')
    } finally { setSaving(false) }
  }

  const inputClass = 'w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600'
  const labelClass = 'text-xs text-gray-400 uppercase tracking-wide block mb-1.5'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-empire-card border border-empire-border rounded-xl w-full max-w-lg shadow-2xl flex flex-col" style={{ maxHeight: '92vh' }}>
        <div className="px-6 py-4 border-b border-empire-border flex items-center justify-between shrink-0">
          <h2 className="text-white font-semibold">Novo Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Nome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nome *</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder="Maria" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Sobrenome</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                placeholder="Silva" className={inputClass} />
            </div>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Telefone *</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (305) 000-0000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com" className={inputClass} />
            </div>
          </div>

          {/* Canal + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Canal de entrada</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inputClass}>
                <option value="manual">Manual</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="chat">Chat</option>
                <option value="sms">SMS</option>
                <option value="referral">Indicação</option>
                <option value="website">Website</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status inicial</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                {PIPELINE_STAGES.map((s) => (
                  <option key={s.status} value={s.status}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Serviço */}
          <div>
            <label className={labelClass}>Tipo de serviço</label>
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={inputClass}>
              {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Endereço</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cidade</label>
              <input value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Miami" className={inputClass} />
            </div>
          </div>

          {/* IDs de redes sociais */}
          <div className="border-t border-empire-border pt-3">
            <p className="text-xs text-gray-500 mb-3">IDs de redes sociais <span className="text-gray-600">(opcionais — necessários para envio via Messenger e Instagram DM)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Facebook PSID</label>
                <input value={facebookPsid} onChange={(e) => setFacebookPsid(e.target.value)}
                  placeholder="Ex: 1234567890123456" className={inputClass} />
                <p className="text-xs text-gray-600 mt-1">Page-Scoped ID do Messenger</p>
              </div>
              <div>
                <label className={labelClass}>Instagram Scoped ID</label>
                <input value={instagramId} onChange={(e) => setInstagramId(e.target.value)}
                  placeholder="Ex: 9876543210987654" className={inputClass} />
                <p className="text-xs text-gray-600 mt-1">ID do usuário no Instagram</p>
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </form>

        <div className="px-6 py-4 border-t border-empire-border flex gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-empire-border text-gray-400 text-sm hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" />Criando…</> : 'Criar Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20

export function LeadsPage({ leads, loading, onLeadAdded }: LeadsPageProps) {
  const [search, setSearch]               = useState('')
  const [filterStatus, setFilterStatus]   = useState('todos')
  const [filterChannel, setFilterChannel] = useState('todos')
  const [filterService, setFilterService] = useState('todos')
  const [selectedLead, setSelectedLead]   = useState<Lead | null>(null)
  const [page, setPage]                   = useState(1)
  const [showNew, setShowNew]             = useState(false)

  const channels = useMemo(() => Array.from(new Set(leads.map((l) => l.channel).filter(Boolean))).sort(), [leads])
  const services = useMemo(() => Array.from(new Set(leads.map((l) => l.service_type).filter((s) => s && s !== 'Unknown'))).sort(), [leads])

  const filtered = useMemo(() => leads.filter((l) => {
    const name = `${l.first_name} ${l.last_name}`.toLowerCase()
    if (search && !name.includes(search.toLowerCase()) && !(l.email ?? '').toLowerCase().includes(search.toLowerCase()) && !l.phone.includes(search)) return false
    if (filterStatus  !== 'todos' && l.status       !== filterStatus)  return false
    if (filterChannel !== 'todos' && l.channel      !== filterChannel) return false
    if (filterService !== 'todos' && l.service_type !== filterService) return false
    return true
  }), [leads, search, filterStatus, filterChannel, filterService])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const reset      = () => setPage(1)

  function exportCSV() {
    const headers = ['Nome', 'Email', 'Telefone', 'Canal', 'Status', 'Serviço', 'Prioridade', 'Score', 'Cidade', 'Data']
    const rows = filtered.map((l) => [
      `${l.first_name} ${l.last_name}`.trim(),
      l.email ?? '',
      l.phone,
      l.channel,
      l.status,
      l.service_type,
      l.priority,
      String(l.lead_score),
      l.city ?? '',
      formatDate(l.created_at),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const selectClass = 'bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 min-w-[140px]'

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <p className="text-empire-muted text-sm mt-0.5">
              {loading ? 'Carregando…' : `${filtered.length === leads.length ? filtered.length : `${filtered.length} de ${leads.length}`} leads`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} disabled={leads.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-empire-border text-gray-300 text-sm hover:text-white hover:border-empire-gold/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Download size={15} />
              Exportar CSV
              {filtered.length > 0 && filtered.length < leads.length && (
                <span className="text-xs text-empire-gold">({filtered.length})</span>
              )}
            </button>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors">
              <Plus size={15} /> Novo Lead
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-empire-card border border-empire-border rounded-xl p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-empire-muted" />
            <input type="text" placeholder="Buscar por nome, email ou telefone…"
              value={search} onChange={(e) => { setSearch(e.target.value); reset() }}
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-empire-muted" />
          </div>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); reset() }} className={selectClass}>
            <option value="todos">Todos os status</option>
            {PIPELINE_STAGES.map((s) => <option key={s.status} value={s.status}>{s.label}</option>)}
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

        {/* Table */}
        <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-empire-muted text-sm">
              <Loader2 size={16} className="animate-spin" /> Carregando leads…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-4xl">🔍</span>
              <p className="text-white font-medium">Nenhum lead encontrado</p>
              <p className="text-empire-muted text-sm">Ajuste os filtros ou adicione um novo lead.</p>
              <button onClick={() => setShowNew(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 mt-1">
                <Plus size={14} /> Novo Lead
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-empire-border text-left bg-empire-navy/30">
                      {['Nome', 'Canal', 'Status', 'Serviço', 'Score', 'Data'].map((h) => (
                        <th key={h} className="px-4 py-3 text-empire-muted font-medium text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((lead, i) => (
                      <tr key={lead.id}
                        className={`border-b border-empire-border/50 hover:bg-empire-gold/5 cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-empire-navy/20' : ''}`}
                        onClick={() => setSelectedLead(lead)}>
                        <td className="px-4 py-3">
                          <p className="text-empire-gold font-medium hover:underline">
                            {`${lead.first_name} ${lead.last_name}`.trim() || '—'}
                          </p>
                          {lead.email && <p className="text-gray-500 text-xs">{lead.email}</p>}
                          {lead.phone && <p className="text-gray-600 text-xs">{lead.phone}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge label={lead.channel}
                            className={CHANNEL_COLORS[lead.channel?.toLowerCase()] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/30'} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-300">{lead.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {lead.service_type !== 'Unknown' ? lead.service_type : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-empire-gold">{lead.lead_score}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{formatDate(lead.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-empire-border">
                  <p className="text-empire-muted text-sm">Página {safePage} de {totalPages} · {filtered.length} leads</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-empire-navy border border-empire-border text-sm text-white hover:border-empire-gold/40 disabled:opacity-40 transition-colors">
                      <ChevronLeft size={15} /> Anterior
                    </button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-empire-navy border border-empire-border text-sm text-white hover:border-empire-gold/40 disabled:opacity-40 transition-colors">
                      Próximo <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />

      {showNew && (
        <NewLeadModal
          onClose={() => setShowNew(false)}
          onCreated={(lead) => {
            onLeadAdded?.(lead)
            setShowNew(false)
          }}
        />
      )}
    </>
  )
}
