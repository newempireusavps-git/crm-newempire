import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User, Clock, Megaphone, Mail, Phone, Wifi, DollarSign, Star, Check } from 'lucide-react'
import type { Lead, LeadActivity, Campaign } from '@/types/lead'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useLeadActivities } from '@/hooks/useLeadActivities'
import { useCampaigns } from '@/hooks/useCampaigns'
import {
  fetchLeadCampaigns,
  addLeadToCampaign,
  removeLeadFromCampaign,
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

interface LeadModalProps {
  lead: Lead | null
  onClose: () => void
}

export function LeadModal({ lead, onClose }: LeadModalProps) {
  const [tab, setTab] = useState<Tab>('info')

  if (!lead) return null

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
        </DialogHeader>

        {/* Tabs */}
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

        {/* Tab content — scrollable */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {tab === 'info' && (
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

          {tab === 'timeline' && <Timeline leadId={lead.id} />}
          {tab === 'campanhas' && <CampaignsTab leadId={lead.id} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
