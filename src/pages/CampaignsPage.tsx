import { useState, useEffect } from 'react'
import { Plus, Trash2, Users, Circle, ChevronRight, ArrowLeft, ExternalLink,
         Mail, MessageSquare, AtSign, Share2, Phone, GripVertical,
         CheckCircle2, Loader2, Save, Zap } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useLeads } from '@/hooks/useLeads'
import type { Campaign, CampaignStep, CampaignChannel, EmailTemplate } from '@/types/lead'
import {
  fetchCampaignSteps, saveCampaignSteps, updateCampaignN8n,
  fetchEmailTemplates, addLeadToCampaign, removeLeadFromCampaign, fetchCampaignLeadIds,
} from '@/lib/supabase'
import { cn } from '@/lib/utils'

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
]

const CHANNEL_META: Record<CampaignChannel, { label: string; icon: React.ReactNode; color: string }> = {
  email:     { label: 'Email',     icon: <Mail size={14} />,          color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  whatsapp:  { label: 'WhatsApp',  icon: <MessageSquare size={14} />, color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  sms:       { label: 'SMS',       icon: <Phone size={14} />,         color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  instagram: { label: 'Instagram', icon: <AtSign size={14} />,        color: 'text-pink-400 bg-pink-400/10 border-pink-400/30' },
  facebook:  { label: 'Facebook',  icon: <Share2 size={14} />,        color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30' },
}

// ─── Create Campaign Modal ────────────────────────────────────────────────────
function CreateCampaignModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (data: Pick<Campaign, 'name' | 'description' | 'color'>) => Promise<Campaign>
}) {
  const [name, setName]        = useState('')
  const [description, setDesc] = useState('')
  const [color, setColor]      = useState(COLORS[0])
  const [saving, setSaving]    = useState(false)
  const [error, setError]      = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome obrigatório'); return }
    setSaving(true)
    try {
      await onCreate({ name: name.trim(), description: description.trim() || null, color })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar campanha')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-empire-card border border-empire-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b border-empire-border">
          <h2 className="text-white font-semibold">Nova Campanha</h2>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Nome *</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Remodeling Kitchen"
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Descrição</label>
            <textarea value={description} onChange={(e) => setDesc(e.target.value)}
              placeholder="Objetivo desta campanha…" rows={2}
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
              className="flex-1 py-2 rounded-lg border border-empire-border text-gray-400 text-sm hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors disabled:opacity-50">
              {saving ? 'Criando…' : 'Criar Campanha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Step Row ─────────────────────────────────────────────────────────────────
type DraftStep = Partial<CampaignStep> & { _key: string }

function StepRow({ step, index, templates, onChange, onRemove }: {
  step: DraftStep
  index: number
  templates: EmailTemplate[]
  onChange: (key: string, field: string, value: unknown) => void
  onRemove: (key: string) => void
}) {
  const ch = (step.channel ?? 'email') as CampaignChannel
  const meta = CHANNEL_META[ch]
  const compatible = templates.filter((t) => t.channel === ch)

  return (
    <div className="flex items-start gap-3 p-4 bg-empire-navy rounded-xl border border-empire-border">
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <GripVertical size={14} className="text-gray-600 cursor-grab" />
        <span className="w-6 h-6 rounded-full bg-empire-gold/20 text-empire-gold text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Canal</label>
          <select value={ch}
            onChange={(e) => onChange(step._key, 'channel', e.target.value)}
            className="w-full bg-empire-dark border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/50">
            {(Object.keys(CHANNEL_META) as CampaignChannel[]).map((c) => (
              <option key={c} value={c}>{CHANNEL_META[c].label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Template</label>
          <select value={step.template_id ?? ''}
            onChange={(e) => onChange(step._key, 'template_id', e.target.value || null)}
            className="w-full bg-empire-dark border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/50">
            <option value="">— Nenhum —</option>
            {compatible.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {compatible.length === 0 && (
            <p className="text-xs text-yellow-500 mt-1">
              Nenhum template de {meta.label}. Crie um na aba Templates.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Aguardar antes (dias)</label>
          <input type="number" min={0} max={365} value={step.delay_days ?? 0}
            onChange={(e) => onChange(step._key, 'delay_days', parseInt(e.target.value) || 0)}
            className="w-full bg-empire-dark border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/50" />
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className={cn('flex items-center gap-1 text-xs border rounded-full px-2 py-0.5 font-medium', meta.color)}>
          {meta.icon}{meta.label}
        </span>
        <button onClick={() => onRemove(step._key)}
          className="text-gray-600 hover:text-red-400 transition-colors p-1">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── n8n workflow builder ─────────────────────────────────────────────────────
function buildN8nWorkflow(campaign: Campaign, steps: CampaignStep[], templates: EmailTemplate[]) {
  const nodes: object[] = []
  const connections: Record<string, object> = {}

  nodes.push({
    name: 'Schedule Trigger',
    type: 'n8n-nodes-base.scheduleTrigger',
    typeVersion: 1.3,
    position: [0, 200],
    parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 6 }] } },
  })

  nodes.push({
    name: 'Get Campaign Leads',
    type: 'n8n-nodes-base.supabase',
    typeVersion: 1,
    position: [280, 200],
    parameters: {
      operation: 'getAll',
      tableId: 'lead_campaigns',
      returnAll: true,
      matchType: 'allFilters',
      filters: { conditions: [
        { keyName: 'campaign_id', condition: 'eq', keyValue: campaign.id },
        { keyName: 'completed', condition: 'eq', keyValue: false },
      ]},
    },
    credentials: { supabaseApi: { id: 'RejDPLBPlbb3ulIn', name: 'Supabase account' } },
  })

  nodes.push({
    name: 'Process Leads',
    type: 'n8n-nodes-base.splitInBatches',
    typeVersion: 3,
    position: [560, 200],
    parameters: { options: {} },
  })

  nodes.push({
    name: 'Time to Send?',
    type: 'n8n-nodes-base.if',
    typeVersion: 2,
    position: [840, 200],
    parameters: {
      conditions: {
        options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' },
        conditions: [{ id: 'tc', leftValue: '={{ $json.next_step_at }}', rightValue: '={{ $now.toISO() }}', operator: { type: 'string', operation: 'lte' } }],
        combinator: 'and',
      },
      options: {},
    },
  })

  nodes.push({
    name: 'Route by Step',
    type: 'n8n-nodes-base.switch',
    typeVersion: 3.2,
    position: [1120, 200],
    parameters: {
      mode: 'rules',
      rules: {
        values: steps.map((s, i) => ({
          conditions: {
            options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' },
            combinator: 'and',
            conditions: [{ leftValue: '={{ $json.current_step }}', rightValue: i, operator: { type: 'number', operation: 'equals' } }],
          },
          renameOutput: true,
          outputKey: `Step ${s.step_order} ${CHANNEL_META[s.channel].label}`,
        })),
      },
      options: {},
    },
  })

  steps.forEach((step, i) => {
    const tpl = templates.find((t) => t.id === step.template_id)
    const sendName = `Send Step ${step.step_order} ${CHANNEL_META[step.channel].label}`
    const updateName = `Update Step ${step.step_order}`
    const yOff = i * 160

    if (step.channel === 'email') {
      nodes.push({
        name: sendName,
        type: 'n8n-nodes-base.gmail',
        typeVersion: 2.1,
        position: [1400, yOff],
        parameters: {
          operation: 'send',
          sendTo: '={{ $json.lead_email }}',
          subject: tpl?.subject ?? `New Empire — Step ${step.step_order}`,
          emailType: 'html',
          message: tpl?.html_body ?? '<p>Hello!</p>',
          options: {},
        },
        credentials: { gmailOAuth2: { id: 'YJWuOKBTU1vU7Ru3', name: 'Gmail account' } },
      })
    } else if (step.channel === 'sms') {
      nodes.push({
        name: sendName,
        type: 'n8n-nodes-base.twilio',
        typeVersion: 1,
        position: [1400, yOff],
        parameters: {
          operation: 'send',
          from: '',
          to: '={{ $json.phone }}',
          message: tpl?.html_body ?? `Hi {{first_name}}, this is New Empire Remodeling!`,
        },
        credentials: { twilioApi: { id: 'YFl6lY0YQmrwtdHB', name: 'Twilio account' } },
      })
    } else if (step.channel === 'whatsapp') {
      nodes.push({
        name: sendName,
        type: 'n8n-nodes-base.twilio',
        typeVersion: 1,
        position: [1400, yOff],
        parameters: {
          operation: 'send',
          from: 'whatsapp:',
          to: '={{ "whatsapp:" + $json.phone }}',
          message: tpl?.html_body ?? `Hi {{first_name}}, this is New Empire Remodeling!`,
        },
        credentials: { twilioApi: { id: 'YFl6lY0YQmrwtdHB', name: 'Twilio account' } },
      })
    } else {
      // instagram / facebook — noOp placeholder until API is configured
      nodes.push({
        name: sendName,
        type: 'n8n-nodes-base.noOp',
        typeVersion: 1,
        position: [1400, yOff],
        notes: `${CHANNEL_META[step.channel].label} DM — connect ${step.channel} Messaging node here. Body: ${tpl?.html_body.slice(0, 80) ?? 'Add template'}`,
        parameters: {},
      })
    }

    const nextStep = steps[i + 1]
    nodes.push({
      name: updateName,
      type: 'n8n-nodes-base.supabase',
      typeVersion: 1,
      position: [1680, yOff],
      parameters: {
        operation: 'update',
        tableId: 'lead_campaigns',
        matchType: 'allFilters',
        filters: { conditions: [
          { keyName: 'lead_id', condition: 'eq', keyValue: '={{ $json.lead_id }}' },
          { keyName: 'campaign_id', condition: 'eq', keyValue: campaign.id },
        ]},
        fieldsUi: { fieldValues: [
          { fieldId: 'current_step', fieldValue: String(step.step_order) },
          { fieldId: 'next_step_at', fieldValue: nextStep ? `={{ $now.plus({ days: ${nextStep.delay_days} }).toISO() }}` : null },
          { fieldId: 'completed', fieldValue: nextStep ? 'false' : 'true' },
        ]},
      },
      credentials: { supabaseApi: { id: 'RejDPLBPlbb3ulIn', name: 'Supabase account' } },
    })

    connections[sendName] = { main: [[{ node: updateName, type: 'main', index: 0 }]] }
    connections[updateName] = { main: [[{ node: 'Process Leads', type: 'main', index: 0 }]] }
  })

  // Route by Step → each send node (one output per step)
  connections['Route by Step'] = {
    main: steps.map((s) => [{ node: `Send Step ${s.step_order} ${CHANNEL_META[s.channel].label}`, type: 'main', index: 0 }]),
  }
  connections['Schedule Trigger']  = { main: [[{ node: 'Get Campaign Leads', type: 'main', index: 0 }]] }
  connections['Get Campaign Leads'] = { main: [[{ node: 'Process Leads', type: 'main', index: 0 }]] }
  connections['Process Leads']      = { main: [null, [{ node: 'Time to Send?', type: 'main', index: 0 }]] }
  connections['Time to Send?']      = { main: [[{ node: 'Route by Step', type: 'main', index: 0 }], [{ node: 'Process Leads', type: 'main', index: 0 }]] }

  return { nodes, connections, settings: { executionOrder: 'v1' } }
}

// ─── Campaign Detail ──────────────────────────────────────────────────────────
function CampaignDetail({ campaign, onBack }: { campaign: Campaign; onBack: () => void }) {
  const { leads } = useLeads()
  const [steps, setSteps]             = useState<DraftStep[]>([])
  const [templates, setTemplates]     = useState<EmailTemplate[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [saving, setSaving]           = useState(false)
  const [syncing, setSyncing]         = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState('')
  const [leadSearch, setLeadSearch]   = useState('')
  const [n8nUrl, setN8nUrl]           = useState(campaign.n8n_workflow_url ?? null)

  useEffect(() => {
    fetchCampaignSteps(campaign.id).then((s) =>
      setSteps(s.map((st) => ({ ...st, _key: st.id })))
    )
    fetchEmailTemplates().then(setTemplates)
    fetchCampaignLeadIds(campaign.id).then((ids) => setEnrolledIds(new Set(ids)))
  }, [campaign.id])

  function addStep() {
    setSteps((prev) => [...prev, {
      _key: crypto.randomUUID(),
      campaign_id: campaign.id,
      step_order: prev.length + 1,
      channel: 'email' as CampaignChannel,
      template_id: null,
      delay_days: prev.length === 0 ? 0 : 3,
    }])
  }

  function changeStep(key: string, field: string, value: unknown) {
    setSteps((prev) => prev.map((s) => s._key === key ? { ...s, [field]: value } : s))
  }

  function removeStep(key: string) {
    setSteps((prev) => prev.filter((s) => s._key !== key).map((s, i) => ({ ...s, step_order: i + 1 })))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const toSave = steps.map((s, i) => ({
        campaign_id: campaign.id,
        step_order: i + 1,
        channel: (s.channel ?? 'email') as CampaignChannel,
        template_id: s.template_id ?? null,
        delay_days: s.delay_days ?? 0,
      }))
      await saveCampaignSteps(campaign.id, toSave)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function handleSyncN8n() {
    if (steps.length === 0) { setError('Adicione pelo menos uma etapa antes de sincronizar.'); return }
    setSyncing(true)
    setError('')
    try {
      const apiKey = localStorage.getItem('n8n_api_key') ?? ''
      if (!apiKey) {
        setError('Configure a API Key do n8n na aba Workflows antes de sincronizar.')
        return
      }
      const n8nBase = '/n8n-api'
      const workflowName = `Campanha: ${campaign.name}`
      const canonicalSteps: CampaignStep[] = steps.map((s, i) => ({
        id: s.id ?? '',
        created_at: s.created_at ?? '',
        updated_at: s.updated_at ?? '',
        campaign_id: campaign.id,
        step_order: i + 1,
        channel: (s.channel ?? 'email') as CampaignChannel,
        template_id: s.template_id ?? null,
        delay_days: s.delay_days ?? 0,
      }))
      const workflow = buildN8nWorkflow(campaign, canonicalSteps, templates)

      const existingId = campaign.n8n_workflow_id
      let workflowId: string

      if (existingId) {
        const res = await fetch(`${n8nBase}/api/v1/workflows/${existingId}`, {
          method: 'PUT',
          headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: workflowName, ...workflow }),
        })
        if (!res.ok) throw new Error(`n8n: ${res.status}`)
        workflowId = existingId
      } else {
        const res = await fetch(`${n8nBase}/api/v1/workflows`, {
          method: 'POST',
          headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: workflowName, ...workflow }),
        })
        if (!res.ok) throw new Error(`n8n: ${res.status}`)
        const data = await res.json() as { id: string }
        workflowId = data.id
      }

      const url = `https://n8n-n8n.ixiqur.easypanel.host/workflow/${workflowId}`
      await updateCampaignN8n(campaign.id, workflowId, url)
      setN8nUrl(url)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao sincronizar com n8n')
    } finally { setSyncing(false) }
  }

  async function toggleLead(leadId: string) {
    if (enrolledIds.has(leadId)) {
      await removeLeadFromCampaign(leadId, campaign.id)
      setEnrolledIds((prev) => { const n = new Set(prev); n.delete(leadId); return n })
    } else {
      await addLeadToCampaign(leadId, campaign.id)
      setEnrolledIds((prev) => new Set([...prev, leadId]))
    }
  }

  const filteredLeads = leads.filter((l) =>
    `${l.first_name} ${l.last_name}`.toLowerCase().includes(leadSearch.toLowerCase()) ||
    (l.email ?? '').toLowerCase().includes(leadSearch.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-empire-card transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Circle size={12} fill={campaign.color} stroke="none" style={{ color: campaign.color }} />
          <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
        </div>
        {n8nUrl && (
          <a href={n8nUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-empire-gold border border-empire-gold/30 rounded-lg px-3 py-1.5 hover:bg-empire-gold/10 transition-colors">
            <ExternalLink size={13} /> Ver no n8n
          </a>
        )}
      </div>

      {/* Steps builder */}
      <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-empire-border flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Etapas do Fluxo</h3>
            <p className="text-gray-500 text-xs mt-0.5">Defina a sequência de mensagens desta campanha</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {saved && <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle2 size={13} />Salvo</span>}
            {error && <span className="text-red-400 text-xs max-w-[180px] text-right">{error}</span>}
            <button onClick={addStep}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-empire-border text-gray-300 text-sm hover:text-white hover:border-empire-gold/40 transition-colors">
              <Plus size={14} /> Etapa
            </button>
            <button onClick={() => void handleSave()} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Salvar
            </button>
            <button onClick={() => void handleSyncN8n()} disabled={syncing || steps.length === 0}
              title="Criar/atualizar workflow no n8n"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition-colors disabled:opacity-50">
              {syncing ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              Sync n8n
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Zap size={32} className="text-empire-muted" />
              <p className="text-white font-medium text-sm">Nenhuma etapa ainda</p>
              <p className="text-empire-muted text-xs max-w-xs">
                Adicione etapas de comunicação para esta campanha. Cada etapa pode usar um canal e template diferentes.
              </p>
              <button onClick={addStep}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 mt-1">
                <Plus size={14} /> Adicionar 1ª etapa
              </button>
            </div>
          ) : (
            steps.map((step, i) => (
              <StepRow key={step._key} step={step} index={i} templates={templates}
                onChange={changeStep} onRemove={removeStep} />
            ))
          )}
        </div>
      </div>

      {/* Lead selection */}
      <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-empire-border flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Leads da Campanha</h3>
            <p className="text-gray-500 text-xs mt-0.5">
              {enrolledIds.size} lead{enrolledIds.size !== 1 ? 's' : ''} incluído{enrolledIds.size !== 1 ? 's' : ''}
            </p>
          </div>
          <Users size={16} className="text-gray-500" />
        </div>
        <div className="p-4 space-y-3">
          <input value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)}
            placeholder="Buscar lead por nome ou email…"
            className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/50 placeholder:text-gray-600" />
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {filteredLeads.map((lead) => {
              const isIn = enrolledIds.has(lead.id)
              return (
                <button key={lead.id} onClick={() => void toggleLead(lead.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all',
                    isIn ? 'border-empire-gold/50 bg-empire-gold/10' : 'border-empire-border bg-empire-navy hover:border-empire-gold/20',
                  )}>
                  <div className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all',
                    isIn ? 'bg-empire-gold border-empire-gold' : 'border-empire-border bg-transparent')}>
                    {isIn && <CheckCircle2 size={11} className="text-empire-dark" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', isIn ? 'text-empire-gold' : 'text-white')}>
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{lead.email ?? lead.phone} · {lead.channel}</p>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{lead.status}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Campaign List ────────────────────────────────────────────────────────────
export function CampaignsPage() {
  const { campaigns, loading, create, remove } = useCampaigns()
  const [showCreate, setShowCreate]        = useState(false)
  const [confirmDelete, setConfirmDelete]  = useState<string | null>(null)
  const [selected, setSelected]            = useState<Campaign | null>(null)

  async function handleDelete(id: string) {
    await remove(id)
    setConfirmDelete(null)
  }

  if (selected) {
    return <CampaignDetail campaign={selected} onBack={() => setSelected(null)} />
  }

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Campanhas</h1>
          <p className="text-gray-400 text-sm mt-1">
            Gerencie campanhas de nutrição e classifique leads em fluxos personalizados.
          </p>
        </div>

        <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-empire-border flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Campanhas de Nutrição</h3>
              <p className="text-gray-500 text-sm mt-0.5">
                {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''} ativa{campaigns.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors">
              <Plus size={15} /> Nova
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-empire-muted text-sm">
              Carregando campanhas…
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">📣</span>
              <p className="text-white font-medium">Nenhuma campanha ainda</p>
              <p className="text-empire-muted text-sm text-center max-w-xs">
                Crie campanhas para organizar leads e disparar fluxos de nutrição multicanal.
              </p>
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
                    <th className="text-left text-gray-400 px-5 py-3 font-medium text-xs uppercase tracking-wide">Campanha</th>
                    <th className="text-left text-gray-400 px-5 py-3 font-medium text-xs uppercase tracking-wide">Descrição</th>
                    <th className="text-center text-gray-400 px-5 py-3 font-medium text-xs uppercase tracking-wide">Leads</th>
                    <th className="text-center text-gray-400 px-5 py-3 font-medium text-xs uppercase tracking-wide">n8n</th>
                    <th className="text-right text-gray-400 px-5 py-3 font-medium text-xs uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-empire-border">
                  {campaigns.map((c) => (
                    <tr key={c.id}
                      className="hover:bg-empire-navy/40 transition-colors cursor-pointer"
                      onClick={() => setSelected(c)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Circle size={10} fill={c.color} stroke="none" style={{ color: c.color }} />
                          <span className="text-white font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-400 max-w-[200px] truncate">{c.description || '—'}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="flex items-center justify-center gap-1 text-gray-300">
                          <Users size={13} />{c.lead_count ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {c.n8n_workflow_url ? (
                          <a href={c.n8n_workflow_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
                            <Zap size={12} /> Ativo
                          </a>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelected(c)}
                            className="text-gray-500 hover:text-empire-gold transition-colors p-1 rounded">
                            <ChevronRight size={15} />
                          </button>
                          {confirmDelete === c.id ? (
                            <>
                              <button onClick={() => void handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Sim</button>
                              <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:text-gray-300">Não</button>
                            </>
                          ) : (
                            <button onClick={() => setConfirmDelete(c.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded">
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

      {showCreate && (
        <CreateCampaignModal onClose={() => setShowCreate(false)} onCreate={create} />
      )}
    </>
  )
}
