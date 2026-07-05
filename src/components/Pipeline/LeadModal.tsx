import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User, Clock, Megaphone, Mail, Phone, Wifi, DollarSign, Star, Check, Pencil, Trash2, Loader2, X } from 'lucide-react'
import type { Lead, LeadActivity, Campaign } from '@/types/lead'
import { PIPELINE_STAGES, SERVICE_TYPES, VALID_CHANNELS, PRIORITY_LEVELS } from '@/types/lead'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useLeadActivities } from '@/hooks/useLeadActivities'
import { useCampaigns } from '@/hooks/useCampaigns'
import {
  fetchLeadCampaigns,
  addLeadToCampaign,
  removeLeadFromCampaign,
  updateLead,
  deleteLead,
} from '@/lib/supabase'

type Tab = 'info' | 'timeline' | 'campanhas'

const ACTIVITY_ICONS: Record<LeadActivity['type'], string> = {
  email:         '📧',
  chat:          '💬',
  followup:      '🔔',
  note:          '📝',
  status_change: '🔄',
  campaign:      '📣',
}

const ACTIVITY_COLORS: Record<LeadActivity['type'], string> = {
  email:         'border-blue-500/40 bg-blue-500/5',
  chat:          'border-purple-500/40 bg-purple-500/5',
  followup:      'border-yellow-500/40 bg-yellow-500/5',
  note:          'border-gray-500/40 bg-gray-500/5',
  status_change: 'border-green-500/40 bg-green-500/5',
  campaign:      'border-pink-500/40 bg-pink-500/5',
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-white">{value || '—'}</span>
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-empire-navy rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-empire-gold rounded-full transition-all"
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <span className="text-xs text-empire-gold font-medium w-8 text-right">{score}</span>
    </div>
  )
}

function Timeline({ leadId }: { leadId: string }) {
  const { activities, loading } = useLeadActivities(leadId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-empire-muted text-sm">
        Carregando atividades…
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <Clock size={32} className="text-empire-muted" />
        <p className="text-white font-medium text-sm">Nenhuma atividade ainda</p>
        <p className="text-empire-muted text-xs">As interações aparecerão aqui automaticamente.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((act) => (
        <div
          key={act.id}
          className={`border rounded-lg p-3 ${ACTIVITY_COLORS[act.type]}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-base mt-0.5">{ACTIVITY_ICONS[act.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium leading-tight">{act.title}</p>
              {act.description && (
                <p className="text-gray-400 text-xs mt-0.5 line-clamp-3">{act.description}</p>
              )}
              <p className="text-gray-600 text-xs mt-1">{formatDate(act.created_at)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function CampaignsTab({ leadId }: { leadId: string }) {
  const { campaigns, loading: campaignsLoading } = useCampaigns()
  const [enrolled, setEnrolled] = useState<Campaign[]>([])
  const [loadingEnrolled, setLoadingEnrolled] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    setLoadingEnrolled(true)
    fetchLeadCampaigns(leadId)
      .then(setEnrolled)
      .finally(() => setLoadingEnrolled(false))
  }, [leadId])

  const enrolledIds = new Set(enrolled.map((c) => c.id))

  async function toggle(campaign: Campaign) {
    setBusy(campaign.id)
    try {
      if (enrolledIds.has(campaign.id)) {
        await removeLeadFromCampaign(leadId, campaign.id)
        setEnrolled((prev) => prev.filter((c) => c.id !== campaign.id))
      } else {
        await addLeadToCampaign(leadId, campaign.id)
        setEnrolled((prev) => [...prev, campaign])
      }
    } finally {
      setBusy(null)
    }
  }

  if (campaignsLoading || loadingEnrolled) {
    return (
      <div className="flex items-center justify-center py-12 text-empire-muted text-sm">
        Carregando campanhas…
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <Megaphone size={32} className="text-empire-muted" />
        <p className="text-white font-medium text-sm">Nenhuma campanha criada</p>
        <p className="text-empire-muted text-xs">Crie campanhas na aba Campanhas do menu.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-empire-muted mb-3">
        Selecione as campanhas para incluir este lead:
      </p>
      {campaigns.map((campaign) => {
        const isIn = enrolledIds.has(campaign.id)
        const isLoading = busy === campaign.id
        return (
          <button
            key={campaign.id}
            onClick={() => void toggle(campaign)}
            disabled={isLoading}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all',
              isIn
                ? 'border-empire-gold/60 bg-empire-gold/10'
                : 'border-empire-border bg-empire-navy hover:border-empire-gold/30',
            )}
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: campaign.color }}
            />
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', isIn ? 'text-empire-gold' : 'text-white')}>
                {campaign.name}
              </p>
              {campaign.description && (
                <p className="text-xs text-gray-500 truncate">{campaign.description}</p>
              )}
            </div>
            <div className={cn(
              'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all',
              isIn ? 'bg-empire-gold border-empire-gold' : 'border-empire-border',
            )}>
              {isIn && <Check size={11} className="text-empire-dark" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function EditLeadForm({ lead, onSaved, onCancel }: {
  lead: Lead
  onSaved: (lead: Lead) => void
  onCancel: () => void
}) {
  const [firstName, setFirstName] = useState(lead.first_name)
  const [lastName, setLastName]   = useState(lead.last_name)
  const [phone, setPhone]         = useState(lead.phone)
  const [email, setEmail]         = useState(lead.email ?? '')
  const [channel, setChannel]     = useState(lead.channel)
  const [serviceType, setServiceType] = useState(lead.service_type)
  const [status, setStatus]       = useState(lead.status)
  const [priority, setPriority]   = useState(lead.priority)
  const [address, setAddress]     = useState(lead.property_address ?? '')
  const [city, setCity]           = useState(lead.city ?? '')
  const [zipCode, setZipCode]     = useState(lead.zip_code ?? '')
  const [timeline, setTimeline]   = useState(lead.timeline ?? '')
  const [value, setValue]         = useState(lead.estimated_project_value?.toString() ?? '')
  const [facebookPsid, setFacebookPsid] = useState(lead.facebook_psid ?? '')
  const [instagramId, setInstagramId]   = useState(lead.instagram_scoped_id ?? '')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const inputClass = 'w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60'
  const labelClass = 'text-xs text-gray-400 uppercase tracking-wide block mb-1'

  async function handleSave() {
    if (!firstName.trim()) { setError('Nome obrigatório'); return }
    if (!phone.trim())     { setError('Telefone obrigatório'); return }
    setSaving(true); setError('')
    try {
      const updated = await updateLead(lead.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        channel,
        service_type: serviceType,
        status,
        priority,
        property_address: address.trim() || null,
        city: city.trim() || null,
        zip_code: zipCode.trim() || null,
        timeline: timeline.trim() || null,
        estimated_project_value: value.trim() ? Number(value) : null,
        facebook_psid: facebookPsid.trim() || null,
        instagram_scoped_id: instagramId.trim() || null,
      })
      onSaved(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar lead')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Nome *</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Sobrenome</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Telefone *</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Canal</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inputClass}>
            {VALID_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select></div>
        <div><label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            {PIPELINE_STAGES.map((s) => <option key={s.status} value={s.status}>{s.label}</option>)}
          </select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Tipo de Serviço</label>
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={inputClass}>
            {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label className={labelClass}>Prioridade</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
            {PRIORITY_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Endereço</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Cidade</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>CEP</label>
          <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Prazo</label>
          <input value={timeline} onChange={(e) => setTimeline(e.target.value)} className={inputClass} /></div>
      </div>
      <div>
        <label className={labelClass}>Valor Estimado (USD)</label>
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-empire-border pt-3">
        <div><label className={labelClass}>Facebook PSID</label>
          <input value={facebookPsid} onChange={(e) => setFacebookPsid(e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Instagram Scoped ID</label>
          <input value={instagramId} onChange={(e) => setInstagramId(e.target.value)} className={inputClass} /></div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex items-center justify-end gap-3 pt-1">
        <button onClick={onCancel} type="button"
          className="px-4 py-2 rounded-lg border border-empire-border text-gray-400 text-sm hover:text-white transition-colors">
          Cancelar
        </button>
        <button onClick={() => void handleSave()} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

interface LeadModalProps {
  lead: Lead | null
  onClose: () => void
  onUpdated?: (lead: Lead) => void
  onDeleted?: (id: string) => void
}

export function LeadModal({ lead, onClose, onUpdated, onDeleted }: LeadModalProps) {
  const [tab, setTab] = useState<Tab>('info')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setEditing(false)
    setConfirmDelete(false)
    setTab('info')
  }, [lead?.id])

  if (!lead) return null

  async function handleDelete() {
    if (!lead) return
    setDeleting(true)
    try {
      await deleteLead(lead.id)
      onDeleted?.(lead.id)
      onClose()
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const fullName = `${lead.first_name} ${lead.last_name}`.trim()

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'info',      label: 'Informações', icon: <User size={14} /> },
    { id: 'timeline',  label: 'Timeline',    icon: <Clock size={14} /> },
    { id: 'campanhas', label: 'Campanhas',   icon: <Megaphone size={14} /> },
  ]

  const priorityColors: Record<string, string> = {
    Hot:  'text-red-400 bg-red-400/10 border-red-400/30',
    Warm: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    Cold: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  }

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-empire-gold">{fullName || 'Lead'}</DialogTitle>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className={cn(
                  'text-xs border rounded-full px-2 py-0.5 font-medium',
                  priorityColors[lead.priority] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/30',
                )}>
                  {lead.priority}
                </span>
                <span className="text-xs border border-empire-border text-gray-400 rounded-full px-2 py-0.5">
                  {lead.status}
                </span>
                {lead.lead_score > 0 && (
                  <span className="flex items-center gap-1 text-xs text-empire-gold border border-empire-gold/30 rounded-full px-2 py-0.5">
                    <Star size={10} />
                    Score {lead.lead_score}
                  </span>
                )}
              </div>
            </div>
            {!editing && (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setEditing(true)} title="Editar lead"
                  className="p-1.5 rounded-lg border border-empire-border text-gray-400 hover:text-empire-gold hover:border-empire-gold/40 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => (confirmDelete ? void handleDelete() : setConfirmDelete(true))}
                  disabled={deleting} title="Remover lead"
                  className={cn(
                    'flex items-center gap-1 p-1.5 rounded-lg border text-xs font-medium transition-colors',
                    confirmDelete
                      ? 'border-red-500/60 text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2'
                      : 'border-empire-border text-gray-400 hover:text-red-400 hover:border-red-500/40',
                  )}>
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {confirmDelete && !deleting && 'Confirmar'}
                </button>
                {confirmDelete && !deleting && (
                  <button onClick={() => setConfirmDelete(false)} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Tabs */}
        {!editing && (
          <div className="flex gap-0 border-b border-empire-border shrink-0 -mx-0.5 mt-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === t.id
                    ? 'border-empire-gold text-empire-gold'
                    : 'border-transparent text-empire-muted hover:text-white',
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab content — scrollable */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {editing && (
            <EditLeadForm
              lead={lead}
              onCancel={() => setEditing(false)}
              onSaved={(updated) => { onUpdated?.(updated); setEditing(false) }}
            />
          )}
          {!editing && tab === 'info' && (
            <div className="space-y-5">
              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <Row label="Email" value={
                  lead.email
                    ? <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-empire-gold hover:underline">
                        <Mail size={12} />{lead.email}
                      </a>
                    : undefined
                } />
                <Row label="Telefone" value={
                  lead.phone
                    ? <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-empire-gold hover:underline">
                        <Phone size={12} />{lead.phone}
                      </a>
                    : undefined
                } />
                <Row label="Canal" value={
                  <span className="flex items-center gap-1"><Wifi size={12} className="text-gray-400" />{lead.channel}</span>
                } />
                <Row label="Serviço" value={lead.service_type !== 'Unknown' ? lead.service_type : undefined} />
                <Row label="Prazo" value={lead.timeline} />
                <Row label="Origem" value={lead.source} />
              </div>

              {/* Value */}
              {(lead.estimated_project_value ?? 0) > 0 && (
                <div className="bg-empire-gold/10 border border-empire-gold/30 rounded-lg p-3 flex items-center gap-3">
                  <DollarSign size={18} className="text-empire-gold shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Valor estimado</p>
                    <p className="text-empire-gold font-bold text-lg">
                      {formatCurrency(lead.estimated_project_value ?? 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* Score */}
              {lead.lead_score > 0 && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Lead Score</span>
                  <ScoreBar score={lead.lead_score} />
                </div>
              )}

              {/* Address */}
              {lead.property_address && (
                <Row label="Endereço" value={
                  `${lead.property_address}${lead.city ? `, ${lead.city}` : ''}${lead.zip_code ? ` ${lead.zip_code}` : ''}`
                } />
              )}

              {/* AI summary */}
              {lead.ai_analysis_summary && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Resumo IA</span>
                  <p className="text-sm text-gray-300 bg-empire-navy rounded-lg p-3">{lead.ai_analysis_summary}</p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-empire-border">
                <Row label="Entrada" value={formatDate(lead.created_at)} />
                {lead.last_contact_at && <Row label="Último contato" value={formatDate(lead.last_contact_at)} />}
              </div>
            </div>
          )}

          {!editing && tab === 'timeline' && <Timeline leadId={lead.id} />}
          {!editing && tab === 'campanhas' && <CampaignsTab leadId={lead.id} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
