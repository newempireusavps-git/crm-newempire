import { useState, useEffect } from 'react'
import {
  Plus, Trash2, Users, Circle, ChevronRight, ArrowLeft, ExternalLink,
  Mail, MessageSquare, AtSign, Share2, Phone, Edit2,
  CheckCircle2, Loader2, Save, Zap, Clock, X,
} from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useLeads } from '@/hooks/useLeads'
import type { Campaign, CampaignStep, CampaignChannel, EmailTemplate } from '@/types/lead'
import {
  fetchCampaignSteps, saveCampaignSteps, updateCampaignN8n,
  fetchEmailTemplates, addLeadToCampaign, removeLeadFromCampaign, fetchCampaignLeadIds,
} from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

export const CHANNEL_META: Record<CampaignChannel, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  email:     { label: 'Email',         icon: <Mail size={16} />,          bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/40' },
  whatsapp:  { label: 'WhatsApp',      icon: <MessageSquare size={16} />, bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/40' },
  sms:       { label: 'SMS',           icon: <Phone size={16} />,         bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40' },
  instagram: { label: 'Instagram DM',  icon: <AtSign size={16} />,        bg: 'bg-pink-500/20',   text: 'text-pink-400',   border: 'border-pink-500/40' },
  facebook:  { label: 'Messenger',     icon: <Share2 size={16} />,        bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40' },
}

const N8N_BASE = '/n8n-api'
const SUPABASE_CRED = { id: 'RejDPLBPlbb3ulIn', name: 'Supabase account' }
const GMAIL_CRED    = { id: 'YJWuOKBTU1vU7Ru3', name: 'Gmail account' }
const TWILIO_CRED   = { id: 'YFl6lY0YQmrwtdHB', name: 'Twilio account' }

// ─── n8n workflow builder ─────────────────────────────────────────────────────
function buildN8nWorkflow(campaign: Campaign, steps: CampaignStep[], templates: EmailTemplate[]) {
  const nodes: object[] = []
  const connections: Record<string, object> = {}

  nodes.push({ name: 'Schedule Trigger', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.3, position: [0, 200],
    parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 6 }] } } })

  nodes.push({ name: 'Get Campaign Leads', type: 'n8n-nodes-base.supabase', typeVersion: 1, position: [280, 200],
    parameters: { operation: 'getAll', tableId: 'lead_campaigns', returnAll: true, matchType: 'allFilters',
      filters: { conditions: [
        { keyName: 'campaign_id', condition: 'eq', keyValue: campaign.id },
        { keyName: 'completed', condition: 'eq', keyValue: false },
      ]}},
    credentials: { supabaseApi: SUPABASE_CRED } })

  nodes.push({ name: 'Process Leads', type: 'n8n-nodes-base.splitInBatches', typeVersion: 3, position: [560, 200], parameters: { options: {} } })

  nodes.push({ name: 'Time to Send?', type: 'n8n-nodes-base.if', typeVersion: 2, position: [840, 200],
    parameters: { conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' },
      conditions: [{ id: 'tc', leftValue: '={{ $json.next_step_at }}', rightValue: '={{ $now.toISO() }}', operator: { type: 'string', operation: 'lte' } }],
      combinator: 'and' }, options: {} } })

  if (steps.length > 0) {
    nodes.push({ name: 'Route by Step', type: 'n8n-nodes-base.switch', typeVersion: 3.2, position: [1120, 200],
      parameters: { mode: 'rules', rules: { values: steps.map((s, i) => ({
        conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, combinator: 'and',
          conditions: [{ leftValue: '={{ $json.current_step }}', rightValue: i, operator: { type: 'number', operation: 'equals' } }] },
        renameOutput: true, outputKey: `Step ${s.step_order} ${CHANNEL_META[s.channel].label}`,
      }))}, options: {} } })

    connections['Time to Send?']  = { main: [[{ node: 'Route by Step', type: 'main', index: 0 }], [{ node: 'Process Leads', type: 'main', index: 0 }]] }
    connections['Route by Step']  = { main: steps.map((s) => [{ node: `Send ${s.step_order}`, type: 'main', index: 0 }]) }

    steps.forEach((step, i) => {
      const tpl  = templates.find((t) => t.id === step.template_id)
      const send = `Send ${step.step_order}`
      const upd  = `Update ${step.step_order}`
      const y    = i * 200

      if (step.channel === 'email') {
        nodes.push({ name: send, type: 'n8n-nodes-base.gmail', typeVersion: 2.1, position: [1400, y],
          parameters: { operation: 'send', sendTo: '={{ $json.lead_email }}',
            subject: tpl?.subject ?? `New Empire — Step ${step.step_order}`,
            emailType: 'html', message: tpl?.html_body ?? '<p>Hello!</p>', options: {} },
          credentials: { gmailOAuth2: GMAIL_CRED } })
      } else if (step.channel === 'sms') {
        nodes.push({ name: send, type: 'n8n-nodes-base.twilio', typeVersion: 1, position: [1400, y],
          parameters: { operation: 'send', from: '', to: '={{ $json.phone }}', message: tpl?.html_body ?? 'Hi from New Empire!' },
          credentials: { twilioApi: TWILIO_CRED } })
      } else if (step.channel === 'whatsapp') {
        nodes.push({ name: send, type: 'n8n-nodes-base.twilio', typeVersion: 1, position: [1400, y],
          parameters: { operation: 'send', from: 'whatsapp:', to: '={{ "whatsapp:" + $json.phone }}', message: tpl?.html_body ?? 'Hi from New Empire!' },
          credentials: { twilioApi: TWILIO_CRED } })
      } else {
        nodes.push({ name: send, type: 'n8n-nodes-base.noOp', typeVersion: 1, position: [1400, y],
          notes: `${CHANNEL_META[step.channel].label} — connect messaging node here.`, parameters: {} })
      }

      const next = steps[i + 1]
      nodes.push({ name: upd, type: 'n8n-nodes-base.supabase', typeVersion: 1, position: [1680, y],
        parameters: { operation: 'update', tableId: 'lead_campaigns', matchType: 'allFilters',
          filters: { conditions: [{ keyName: 'lead_id', condition: 'eq', keyValue: '={{ $json.lead_id }}' }, { keyName: 'campaign_id', condition: 'eq', keyValue: campaign.id }] },
          fieldsUi: { fieldValues: [
            { fieldId: 'current_step', fieldValue: String(step.step_order) },
            { fieldId: 'next_step_at', fieldValue: next ? `={{ $now.plus({ days: ${next.delay_days} }).toISO() }}` : null },
            { fieldId: 'completed', fieldValue: next ? 'false' : 'true' },
          ]}},
        credentials: { supabaseApi: SUPABASE_CRED } })

      connections[send] = { main: [[{ node: upd, type: 'main', index: 0 }]] }
      connections[upd]  = { main: [[{ node: 'Process Leads', type: 'main', index: 0 }]] }
    })
  } else {
    nodes.push({ name: 'No Steps Yet', type: 'n8n-nodes-base.noOp', typeVersion: 1, position: [1120, 200],
      notes: 'Add steps in the CRM Campaign Builder.', parameters: {} })
    connections['Time to Send?'] = { main: [[{ node: 'No Steps Yet', type: 'main', index: 0 }], [{ node: 'Process Leads', type: 'main', index: 0 }]] }
  }

  connections['Schedule Trigger']   = { main: [[{ node: 'Get Campaign Leads', type: 'main', index: 0 }]] }
  connections['Get Campaign Leads'] = { main: [[{ node: 'Process Leads', type: 'main', index: 0 }]] }
  connections['Process Leads']      = { main: [null, [{ node: 'Time to Send?', type: 'main', index: 0 }]] }

  return { nodes, connections, settings: { executionOrder: 'v1' } }
}

async function syncToN8n(campaign: Campaign, steps: CampaignStep[], templates: EmailTemplate[]): Promise<{ id: string; url: string }> {
  const apiKey = localStorage.getItem('n8n_api_key') ?? ''
  if (!apiKey) throw new Error('API Key do n8n não configurada. Configure na aba Workflows.')
  const body = JSON.stringify({ name: `Campanha: ${campaign.name}`, ...buildN8nWorkflow(campaign, steps, templates) })
  const headers = { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' }

  if (campaign.n8n_workflow_id) {
    const r = await fetch(`${N8N_BASE}/api/v1/workflows/${campaign.n8n_workflow_id}`, { method: 'PUT', headers, body })
    if (!r.ok) throw new Error(`n8n ${r.status}`)
    await updateCampaignN8n(campaign.id, campaign.n8n_workflow_id, `https://n8n-n8n.ixiqur.easypanel.host/workflow/${campaign.n8n_workflow_id}`)
    return { id: campaign.n8n_workflow_id, url: `https://n8n-n8n.ixiqur.easypanel.host/workflow/${campaign.n8n_workflow_id}` }
  } else {
    const r = await fetch(`${N8N_BASE}/api/v1/workflows`, { method: 'POST', headers, body })
    if (!r.ok) throw new Error(`n8n ${r.status}`)
    const d = await r.json() as { id: string }
    const url = `https://n8n-n8n.ixiqur.easypanel.host/workflow/${d.id}`
    await updateCampaignN8n(campaign.id, d.id, url)
    return { id: d.id, url }
  }
}

// ─── Workflow Timeline (read view) ────────────────────────────────────────────
function WorkflowTimeline({ steps, templates }: { steps: CampaignStep[]; templates: EmailTemplate[] }) {
  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
        <Zap size={28} className="text-gray-600" />
        <p className="text-gray-400 text-sm">Nenhuma etapa definida.</p>
        <p className="text-gray-600 text-xs">Clique em "Editar Fluxo" para adicionar etapas.</p>
      </div>
    )
  }

  let accDays = 0
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        accDays += step.delay_days
        const meta = CHANNEL_META[step.channel as CampaignChannel] ?? CHANNEL_META.email
        const tpl  = templates.find((t) => t.id === step.template_id)
        return (
          <div key={step.id ?? i}>
            {/* Connector */}
            {i > 0 && (
              <div className="flex items-center gap-3 ml-6 py-1">
                <div className="w-0.5 h-8 bg-empire-border mx-auto" style={{ marginLeft: '11px' }} />
                <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-1">
                  <Clock size={11} />
                  {step.delay_days === 0 ? 'Imediatamente' : `Aguardar ${step.delay_days} dia${step.delay_days !== 1 ? 's' : ''}`}
                </div>
              </div>
            )}
            {/* Step card */}
            <div className={cn('flex items-start gap-4 p-4 rounded-xl border', meta.bg, meta.border)}>
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 border', meta.bg, meta.border)}>
                <span className={meta.text}>{meta.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('text-xs font-semibold', meta.text)}>{meta.label}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-400 text-xs">Dia {accDays}</span>
                  {!tpl && <span className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/30 rounded px-1.5 py-0.5">Sem template</span>}
                </div>
                {tpl ? (
                  <>
                    <p className="text-white text-sm font-medium mt-0.5">{tpl.name}</p>
                    {tpl.subject && tpl.channel === 'email' && (
                      <p className="text-gray-500 text-xs mt-0.5 truncate">✉ {tpl.subject}</p>
                    )}
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                      {tpl.html_body.replace(/<[^>]+>/g, '').slice(0, 120)}…
                    </p>
                  </>
                ) : (
                  <p className="text-gray-600 text-xs mt-1">Atribua um template na aba Templates.</p>
                )}
              </div>
              <span className="text-xs text-gray-600 shrink-0 pt-0.5">#{step.step_order}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Step editor row ──────────────────────────────────────────────────────────
type DraftStep = Partial<CampaignStep> & { _key: string }

function StepEditorRow({ step, index, templates, onChange, onRemove }: {
  step: DraftStep; index: number; templates: EmailTemplate[]
  onChange: (key: string, field: string, value: unknown) => void
  onRemove: (key: string) => void
}) {
  const ch   = (step.channel ?? 'email') as CampaignChannel
  const meta = CHANNEL_META[ch]
  const compat = templates.filter((t) => t.channel === ch)

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-xl border', meta.bg, meta.border)}>
      <div className="flex flex-col items-center gap-1 pt-1">
        <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border', meta.bg, meta.border, meta.text)}>
          {index + 1}
        </span>
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Canal</label>
          <select value={ch} onChange={(e) => onChange(step._key, 'channel', e.target.value)}
            className="w-full bg-empire-dark border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/50">
            {(Object.keys(CHANNEL_META) as CampaignChannel[]).map((c) => (
              <option key={c} value={c}>{CHANNEL_META[c].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Template</label>
          <select value={step.template_id ?? ''} onChange={(e) => onChange(step._key, 'template_id', e.target.value || null)}
            className="w-full bg-empire-dark border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/50">
            <option value="">— Nenhum —</option>
            {compat.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {compat.length === 0 && <p className="text-xs text-yellow-500 mt-1">Crie um template de {meta.label} na aba Templates.</p>}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Aguardar antes (dias)</label>
          <input type="number" min={0} max={365} value={step.delay_days ?? 0}
            onChange={(e) => onChange(step._key, 'delay_days', parseInt(e.target.value) || 0)}
            className="w-full bg-empire-dark border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/50" />
        </div>
      </div>
      <button onClick={() => onRemove(step._key)} className="text-gray-600 hover:text-red-400 transition-colors p-1 mt-1">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Campaign Detail ──────────────────────────────────────────────────────────
function CampaignDetail({ campaign: init, onBack }: { campaign: Campaign; onBack: () => void }) {
  const { leads } = useLeads()
  const [campaign, setCampaign]       = useState<Campaign>(init)
  const [steps, setSteps]             = useState<CampaignStep[]>([])
  const [draftSteps, setDraftSteps]   = useState<DraftStep[]>([])
  const [templates, setTemplates]     = useState<EmailTemplate[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [editing, setEditing]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState('')
  const [leadSearch, setLeadSearch]   = useState('')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    setLoadingData(true)
    Promise.all([
      fetchCampaignSteps(init.id),
      fetchEmailTemplates(),
      fetchCampaignLeadIds(init.id),
    ]).then(([s, t, ids]) => {
      setSteps(s)
      setDraftSteps(s.map((st) => ({ ...st, _key: st.id })))
      setTemplates(t)
      setEnrolledIds(new Set(ids))
    }).catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar dados'))
    .finally(() => setLoadingData(false))
  }, [init.id])

  function startEdit() {
    setDraftSteps(steps.map((s) => ({ ...s, _key: s.id })))
    setEditing(true)
  }

  function cancelEdit() {
    setDraftSteps(steps.map((s) => ({ ...s, _key: s.id })))
    setEditing(false)
    setError('')
  }

  function addStep() {
    setDraftSteps((prev) => [...prev, {
      _key: crypto.randomUUID(),
      campaign_id: campaign.id,
      step_order: prev.length + 1,
      channel: 'email' as CampaignChannel,
      template_id: null,
      delay_days: prev.length === 0 ? 0 : 3,
    }])
  }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      const canonical: CampaignStep[] = draftSteps.map((s, i) => ({
        id: s.id ?? '',
        created_at: s.created_at ?? '',
        updated_at: s.updated_at ?? '',
        campaign_id: campaign.id,
        step_order: i + 1,
        channel: (s.channel ?? 'email') as CampaignChannel,
        template_id: s.template_id ?? null,
        delay_days: s.delay_days ?? 0,
      }))
      await saveCampaignSteps(campaign.id, canonical)
      setSteps(canonical)
      try {
        const { id, url } = await syncToN8n(campaign, canonical, templates)
        setCampaign((p) => ({ ...p, n8n_workflow_id: id, n8n_workflow_url: url }))
      } catch { /* ignore n8n errors silently if key not set */ }
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function toggleLead(id: string) {
    try {
      if (enrolledIds.has(id)) {
        await removeLeadFromCampaign(id, campaign.id)
        setEnrolledIds((p) => { const n = new Set(p); n.delete(id); return n })
      } else {
        await addLeadToCampaign(id, campaign.id)
        setEnrolledIds((p) => new Set([...p, id]))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar lead')
    }
  }

  const enrolledLeads = leads.filter((l) => enrolledIds.has(l.id))
  const allLeads = leads.filter((l) =>
    `${l.first_name} ${l.last_name}`.toLowerCase().includes(leadSearch.toLowerCase()) ||
    (l.email ?? '').toLowerCase().includes(leadSearch.toLowerCase())
  )

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-empire-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-empire-card transition-colors">
          <ArrowLeft size={18} />
        </button>
        <Circle size={12} fill={campaign.color} stroke="none" style={{ color: campaign.color }} />
        <h1 className="text-2xl font-bold text-white flex-1">{campaign.name}</h1>
        {saved && <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle2 size={13} />Salvo</span>}
        {error && <span className="text-red-400 text-xs">{error}</span>}
        {campaign.n8n_workflow_url && (
          <a href={campaign.n8n_workflow_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-purple-400 border border-purple-400/30 rounded-lg px-3 py-1.5 hover:bg-purple-400/10 transition-colors">
            <ExternalLink size={13} /> Ver no n8n
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT: Workflow ── */}
        <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-empire-border flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Fluxo de Comunicação</h3>
              <p className="text-gray-500 text-xs mt-0.5">{steps.length} etapa{steps.length !== 1 ? 's' : ''} configurada{steps.length !== 1 ? 's' : ''}</p>
            </div>
            {!editing ? (
              <button onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-empire-border text-gray-300 text-sm hover:text-white hover:border-empire-gold/40 transition-colors">
                <Edit2 size={13} /> Editar Fluxo
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={cancelEdit} className="text-gray-400 hover:text-white p-1.5 rounded-lg border border-empire-border transition-colors">
                  <X size={14} />
                </button>
                <button onClick={addStep}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-empire-border text-gray-300 text-sm hover:text-white transition-colors">
                  <Plus size={13} /> Etapa
                </button>
                <button onClick={() => void handleSave()} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Salvar
                </button>
              </div>
            )}
          </div>

          <div className="p-5">
            {editing ? (
              <div className="space-y-2">
                {draftSteps.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-3">Nenhuma etapa ainda</p>
                    <button onClick={addStep}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 mx-auto">
                      <Plus size={14} /> Adicionar etapa
                    </button>
                  </div>
                ) : draftSteps.map((s, i) => (
                  <StepEditorRow key={s._key} step={s} index={i} templates={templates}
                    onChange={(key, field, val) => setDraftSteps((prev) => prev.map((x) => x._key === key ? { ...x, [field]: val } : x))}
                    onRemove={(key) => setDraftSteps((prev) => prev.filter((x) => x._key !== key).map((x, j) => ({ ...x, step_order: j + 1 })))} />
                ))}
              </div>
            ) : (
              <WorkflowTimeline steps={steps} templates={templates} />
            )}
          </div>
        </div>

        {/* ── RIGHT: Leads ── */}
        <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-empire-border flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Leads da Campanha</h3>
              <p className="text-gray-500 text-xs mt-0.5">{enrolledIds.size} inscrito{enrolledIds.size !== 1 ? 's' : ''}</p>
            </div>
            <Users size={16} className="text-gray-500" />
          </div>

          {/* Enrolled leads summary */}
          {enrolledLeads.length > 0 && (
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Inscritos nesta campanha</p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {enrolledLeads.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-empire-gold/10 border border-empire-gold/30">
                    <CheckCircle2 size={13} className="text-empire-gold shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-empire-gold font-medium truncate">{l.first_name} {l.last_name}</p>
                      <p className="text-xs text-gray-500 truncate">{l.email ?? l.phone}</p>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">{l.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add leads */}
          <div className="px-5 pb-5 pt-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Adicionar / remover leads</p>
            <input value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)}
              placeholder="Buscar por nome ou email…"
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/50 placeholder:text-gray-600 mb-2" />
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {allLeads.map((l) => {
                const isIn = enrolledIds.has(l.id)
                return (
                  <button key={l.id} onClick={() => void toggleLead(l.id)}
                    className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all',
                      isIn ? 'border-empire-gold/40 bg-empire-gold/5' : 'border-empire-border bg-empire-navy hover:border-gray-600')}>
                    <div className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      isIn ? 'bg-empire-gold border-empire-gold' : 'border-empire-border')}>
                      {isIn && <CheckCircle2 size={10} className="text-empire-dark" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium truncate', isIn ? 'text-empire-gold' : 'text-white')}>
                        {l.first_name} {l.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{l.channel} · {l.status}</p>
                    </div>
                  </button>
                )
              })}
              {allLeads.length === 0 && <p className="text-xs text-gray-600 text-center py-4">Nenhum lead encontrado</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Create Campaign Modal ────────────────────────────────────────────────────
function CreateCampaignModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (d: Pick<Campaign, 'name' | 'description' | 'color'>) => Promise<Campaign>
}) {
  const [name, setName]     = useState('')
  const [desc, setDesc]     = useState('')
  const [color, setColor]   = useState(COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome obrigatório'); return }
    setSaving(true)
    try {
      const c = await onCreate({ name: name.trim(), description: desc.trim() || null, color })
      try { await syncToN8n(c, [], []) } catch { /* ok if api key missing */ }
      onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-empire-card border border-empire-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b border-empire-border flex items-center justify-between">
          <h2 className="text-white font-semibold">Nova Campanha</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Nome *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Remodeling Kitchen"
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Descrição</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Objetivo desta campanha…"
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600 resize-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: color === c ? 'white' : 'transparent', transform: color === c ? 'scale(1.15)' : 'scale(1)' }} />
              ))}
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-empire-border text-gray-400 text-sm hover:text-white transition-colors">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 disabled:opacity-50 transition-colors">
              {saving ? 'Criando…' : 'Criar Campanha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Campaigns List Page ──────────────────────────────────────────────────────
export function CampaignsPage() {
  const { campaigns, loading, create, remove } = useCampaigns()
  const [showCreate, setShowCreate]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selected, setSelected]           = useState<Campaign | null>(null)

  if (selected) {
    return <CampaignDetail campaign={selected} onBack={() => setSelected(null)} />
  }

  return (
    <>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Campanhas</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie campanhas de nutrição e fluxos de comunicação multicanal.</p>
        </div>

        <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-empire-border flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Campanhas de Nutrição</h3>
              <p className="text-gray-500 text-sm mt-0.5">{campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors">
              <Plus size={15} /> Nova
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-empire-muted text-sm">
              <Loader2 size={16} className="animate-spin" /> Carregando…
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">📣</span>
              <p className="text-white font-medium">Nenhuma campanha ainda</p>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 mt-1">
                <Plus size={15} /> Criar primeira campanha
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-empire-border bg-empire-navy/50">
                    {['Campanha', 'Descrição', 'Leads', 'n8n', ''].map((h) => (
                      <th key={h} className="text-left text-gray-400 px-5 py-3 font-medium text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-empire-border">
                  {campaigns.map((c) => (
                    <tr key={c.id} onClick={() => setSelected(c)}
                      className="hover:bg-empire-navy/40 transition-colors cursor-pointer">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Circle size={10} fill={c.color} stroke="none" style={{ color: c.color }} />
                          <span className="text-white font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-400 max-w-[180px] truncate">{c.description || '—'}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1 text-gray-300"><Users size={13} />{c.lead_count ?? 0}</span>
                      </td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        {c.n8n_workflow_url
                          ? <a href={c.n8n_workflow_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"><Zap size={12} />Ativo</a>
                          : <span className="text-xs text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelected(c)} className="text-gray-500 hover:text-empire-gold p-1 rounded transition-colors">
                            <ChevronRight size={15} />
                          </button>
                          {confirmDelete === c.id ? (
                            <>
                              <button onClick={() => { void remove(c.id); setConfirmDelete(null) }} className="text-xs text-red-400 font-medium">Sim</button>
                              <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500">Não</button>
                            </>
                          ) : (
                            <button onClick={() => setConfirmDelete(c.id)} className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} onCreate={create} />}
    </>
  )
}
