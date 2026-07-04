import { useState, useEffect, useRef } from 'react'
import {
  Save, Eye, EyeOff, Mail, MessageSquare, AtSign, Share2, Phone,
  ChevronDown, ChevronUp, Loader2, Plus, X, Users, CheckCircle2, Trash2,
} from 'lucide-react'
import type { EmailTemplate, CampaignChannel, Campaign, CampaignStep } from '@/types/lead'
import {
  fetchEmailTemplates, updateEmailTemplate, createEmailTemplate, deleteEmailTemplate,
  fetchCampaigns, fetchCampaignSteps, saveCampaignSteps, fetchCampaignLeadIds,
  fetchLeads,
} from '@/lib/supabase'
import { cn } from '@/lib/utils'

export const CHANNEL_META: Record<CampaignChannel, { label: string; icon: React.ReactNode; color: string }> = {
  email:     { label: 'Email',          icon: <Mail size={14} />,          color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
  whatsapp:  { label: 'WhatsApp',       icon: <MessageSquare size={14} />, color: 'text-green-400 border-green-400/30 bg-green-400/10' },
  sms:       { label: 'SMS',            icon: <Phone size={14} />,         color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
  instagram: { label: 'Instagram DM',   icon: <AtSign size={14} />,        color: 'text-pink-400 border-pink-400/30 bg-pink-400/10' },
  facebook:  { label: 'Messenger',      icon: <Share2 size={14} />,        color: 'text-indigo-400 border-indigo-400/30 bg-indigo-400/10' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function PreviewPane({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    const doc = ref.current?.contentDocument
    if (!doc) return
    doc.open(); doc.write(html); doc.close()
  }, [html])
  return <iframe ref={ref} className="w-full h-full rounded-lg border-0 bg-white" title="Preview" sandbox="allow-same-origin" />
}

// ─── Inline editor ────────────────────────────────────────────────────────────
function TemplateEditor({ template, onSaved }: { template: EmailTemplate; onSaved: (t: EmailTemplate) => void }) {
  const [name, setName]       = useState(template.name)
  const [desc, setDesc]       = useState(template.description ?? '')
  const [subject, setSubject] = useState(template.subject ?? '')
  const [body, setBody]       = useState(template.html_body ?? '')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  const isEmail = template.channel === 'email'
  const dirty = name !== template.name || desc !== (template.description ?? '') ||
                subject !== (template.subject ?? '') || body !== (template.html_body ?? '')

  async function save() {
    setSaving(true); setError('')
    try {
      await updateEmailTemplate(template.id, { name: name.trim(), description: desc.trim() || null, subject: subject.trim(), html_body: body })
      onSaved({ ...template, name: name.trim(), description: desc.trim() || null, subject: subject.trim(), html_body: body })
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60" />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Descrição</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Opcional"
            className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600" />
        </div>
      </div>
      {isEmail && (
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Assunto do Email</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60" />
        </div>
      )}
      <p className="text-xs text-gray-500">
        Use <code className="text-empire-gold bg-empire-navy px-1 rounded">{'{{first_name}}'}</code> para o nome do lead.
      </p>
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400 uppercase tracking-wide">{isEmail ? 'HTML' : 'Mensagem'}</label>
        {isEmail && (
          <button onClick={() => setPreview((p) => !p)} type="button"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            {preview ? <><EyeOff size={12} /> Editar</> : <><Eye size={12} /> Preview</>}
          </button>
        )}
      </div>
      {preview && isEmail
        ? <div className="h-96 border border-empire-border rounded-lg overflow-hidden"><PreviewPane html={body} /></div>
        : <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={isEmail ? 16 : 7} spellCheck={false}
            className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 font-mono resize-y" />
      }
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-green-400 text-xs">Salvo ✓</span>}
        <button onClick={() => void save()} disabled={saving || !dirty}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
            dirty ? 'bg-empire-gold text-empire-dark hover:bg-empire-gold/90' : 'bg-empire-card text-gray-500 cursor-not-allowed border border-empire-border')}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function TemplateCard({ template, onSaved, onDeleted }: {
  template: EmailTemplate
  onSaved: (t: EmailTemplate) => void
  onDeleted: (id: string) => void
}) {
  const [open, setOpen]       = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const meta = CHANNEL_META[(template.channel ?? 'email') as CampaignChannel] ?? CHANNEL_META.email

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm) { setConfirm(true); return }
    setDeleting(true)
    try { await deleteEmailTemplate(template.id); onDeleted(template.id) }
    catch { setDeleting(false); setConfirm(false) }
  }

  return (
    <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 hover:bg-empire-navy/40 transition-colors">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-3 flex-1 text-left min-w-0">
          <span className="text-empire-gold shrink-0">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">{template.name}</p>
            {template.description && <p className="text-gray-500 text-xs mt-0.5 truncate">{template.description}</p>}
          </div>
          <span className={cn('text-xs px-2 py-0.5 rounded-full border shrink-0', meta.color)}>{meta.label}</span>
          {open ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
        </button>
        <button onClick={(e) => void handleDelete(e)} disabled={deleting}
          className={cn(
            'shrink-0 ml-2 p-1.5 rounded-lg border text-xs font-medium transition-colors',
            confirm
              ? 'border-red-500/60 text-red-400 bg-red-500/10 hover:bg-red-500/20'
              : 'border-empire-border text-gray-600 hover:text-red-400 hover:border-red-500/40',
          )}>
          {deleting ? <Loader2 size={13} className="animate-spin" /> : confirm ? <><Trash2 size={13} className="inline" /> Confirmar</> : <Trash2 size={13} />}
        </button>
        {confirm && !deleting && (
          <button onClick={(e) => { e.stopPropagation(); setConfirm(false) }}
            className="shrink-0 p-1.5 text-gray-600 hover:text-white transition-colors">
            <X size={13} />
          </button>
        )}
      </div>
      {open && (
        <div className="px-5 pb-5 border-t border-empire-border pt-4">
          <TemplateEditor template={template} onSaved={onSaved} />
        </div>
      )}
    </div>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (t: EmailTemplate) => void
}) {
  // Form state
  const [channel, setChannel]       = useState<CampaignChannel>('email')
  const [name, setName]             = useState('')
  const [desc, setDesc]             = useState('')
  const [subject, setSubject]       = useState('')
  const [body, setBody]             = useState('')
  // Campaign assignment
  const [campaigns, setCampaigns]   = useState<Campaign[]>([])
  const [campaignId, setCampaignId] = useState('')
  const [steps, setSteps]           = useState<CampaignStep[]>([])
  const [stepOrder, setStepOrder]   = useState<number | ''>('')
  // Leads preview
  const [leads, setLeads]           = useState<{ id: string; first_name: string; last_name: string; status: string; email: string | null; phone: string }[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [leadSearch, setLeadSearch] = useState('')
  // UI
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [preview, setPreview]       = useState(false)

  const isEmail = channel === 'email'

  // Load campaigns on mount
  useEffect(() => {
    fetchCampaigns().then(setCampaigns).catch(() => {})
    fetchLeads().then(setLeads).catch(() => {})
  }, [])

  // Load steps + enrolled leads when campaign changes
  useEffect(() => {
    if (!campaignId) { setSteps([]); setStepOrder(''); setEnrolledIds(new Set()); return }
    fetchCampaignSteps(campaignId).then(setSteps).catch(() => {})
    fetchCampaignLeadIds(campaignId).then((ids) => setEnrolledIds(new Set(ids))).catch(() => {})
  }, [campaignId])

  const campaignLeads = leads.filter((l) =>
    enrolledIds.has(l.id) &&
    (`${l.first_name} ${l.last_name}`.toLowerCase().includes(leadSearch.toLowerCase()) ||
     (l.email ?? '').toLowerCase().includes(leadSearch.toLowerCase()))
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true); setError('')
    try {
      const created = await createEmailTemplate({
        name: name.trim(),
        description: desc.trim() || null,
        channel,
        subject: isEmail ? (subject.trim() || name.trim()) : name.trim(),
        html_body: body,
        template_key: `custom_${Date.now()}`,
        is_active: true,
      })

      // Assign to step if chosen
      if (campaignId && stepOrder !== '') {
        const updated = steps.map((s) => s.step_order === Number(stepOrder) ? { ...s, template_id: created.id } : s)
        await saveCampaignSteps(
          campaignId,
          updated.map(({ id: _id, created_at: _c, updated_at: _u, template: _t, ...rest }) => rest),
        )
      }
      onCreate(created)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar template')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-empire-card border border-empire-border rounded-xl w-full max-w-2xl shadow-2xl flex flex-col" style={{ maxHeight: '92vh' }}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-empire-border flex items-center justify-between shrink-0">
          <h2 className="text-white font-semibold">Novo Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Canal + Nome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Canal *</label>
              <select value={channel} onChange={(e) => { setChannel(e.target.value as CampaignChannel); setPreview(false) }}
                className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60">
                {(Object.keys(CHANNEL_META) as CampaignChannel[]).map((c) => (
                  <option key={c} value={c}>{CHANNEL_META[c].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Nome *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: WhatsApp Dia 1"
                className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600" />
            </div>
          </div>

          {/* Campanha + Etapa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Campanha (opcional)</label>
              <select value={campaignId} onChange={(e) => { setCampaignId(e.target.value); setStepOrder('') }}
                className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60">
                <option value="">— Selecionar —</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Etapa no workflow</label>
              <select value={stepOrder} onChange={(e) => setStepOrder(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!campaignId}
                className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 disabled:opacity-40">
                <option value="">— Selecionar etapa —</option>
                {steps.map((s) => (
                  <option key={s.step_order} value={s.step_order}>
                    Etapa {s.step_order} — {CHANNEL_META[s.channel as CampaignChannel]?.label ?? s.channel}
                    {s.template_id ? ' (tem template)' : ''}
                  </option>
                ))}
              </select>
              {campaignId && steps.length === 0 && (
                <p className="text-xs text-yellow-500 mt-1">Campanha sem etapas. Adicione na aba Campanhas.</p>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Descrição</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Opcional"
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600" />
          </div>

          {/* Assunto — email only */}
          {isEmail && (
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Assunto do Email</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Transforme sua cozinha — New Empire Remodeling"
                className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600" />
            </div>
          )}

          {/* Conteúdo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wide">{isEmail ? 'HTML do Email' : 'Texto da Mensagem'}</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">
                  <code className="text-empire-gold">{'{{first_name}}'}</code> → nome do lead
                </span>
                {isEmail && (
                  <button type="button" onClick={() => setPreview((p) => !p)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                    {preview ? <><EyeOff size={12} /> Editar</> : <><Eye size={12} /> Preview</>}
                  </button>
                )}
              </div>
            </div>
            {preview && isEmail
              ? <div className="h-64 border border-empire-border rounded-lg overflow-hidden"><PreviewPane html={body} /></div>
              : <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={isEmail ? 10 : 5} spellCheck={false}
                  placeholder={isEmail
                    ? '<p>Olá {{first_name}},</p>\n<p>Aqui é a New Empire Remodeling...</p>'
                    : 'Olá {{first_name}}! Aqui é a New Empire 👋'}
                  className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 font-mono resize-y placeholder:text-gray-600" />
            }
          </div>

          {/* Leads da campanha selecionada */}
          {campaignId && enrolledIds.size > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users size={13} className="text-gray-400" />
                  <label className="text-xs text-gray-400 uppercase tracking-wide">
                    Leads nesta campanha ({enrolledIds.size})
                  </label>
                </div>
                <input value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Filtrar…"
                  className="bg-empire-navy border border-empire-border text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-empire-gold/50 placeholder:text-gray-600 w-32" />
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {campaignLeads.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-empire-navy border border-empire-border">
                    <CheckCircle2 size={12} className="text-empire-gold shrink-0" />
                    <span className="text-sm text-white flex-1 truncate">{l.first_name} {l.last_name}</span>
                    <span className="text-xs text-gray-500">{l.status}</span>
                  </div>
                ))}
                {campaignLeads.length === 0 && <p className="text-xs text-gray-600 text-center py-2">Nenhum lead encontrado</p>}
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-empire-border flex gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-empire-border text-gray-400 text-sm hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 disabled:opacity-50 transition-colors">
            {saving ? 'Criando…' : stepOrder !== '' ? 'Criar e Atribuir à Etapa' : 'Criar Template'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function TemplatesPage() {
  const [templates, setTemplates]   = useState<EmailTemplate[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter]         = useState<CampaignChannel | 'all'>('all')

  useEffect(() => {
    fetchEmailTemplates()
      .then(setTemplates)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar templates'))
      .finally(() => setLoading(false))
  }, [])

  const visible = filter === 'all' ? templates : templates.filter((t) => t.channel === filter)
  const channels = (Object.keys(CHANNEL_META) as CampaignChannel[]).filter((c) => templates.some((t) => t.channel === c))

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Templates de Mensagens</h1>
            <p className="text-gray-400 text-sm mt-1">
              Edite os textos dos fluxos de nutrição sem precisar acessar o n8n.
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors shrink-0">
            <Plus size={15} /> Novo
          </button>
        </div>

        {/* Channel filter chips */}
        {templates.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter('all')}
              className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                filter === 'all' ? 'bg-empire-gold text-empire-dark border-empire-gold' : 'border-empire-border text-gray-400 hover:text-white')}>
              Todos ({templates.length})
            </button>
            {channels.map((c) => (
              <button key={c} onClick={() => setFilter(c)}
                className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  filter === c ? CHANNEL_META[c].color : 'border-empire-border text-gray-400 hover:text-white')}>
                {CHANNEL_META[c].icon}
                {CHANNEL_META[c].label}
                <span className="opacity-60">({templates.filter((t) => t.channel === c).length})</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-12">
            <Loader2 size={16} className="animate-spin" /> Carregando…
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Mail size={32} className="text-empire-muted" />
            <p className="text-white font-medium">{templates.length === 0 ? 'Nenhum template ainda' : 'Nenhum template neste canal'}</p>
            <p className="text-empire-muted text-sm max-w-xs">
              Crie templates de Email, WhatsApp, SMS, Instagram DM e Messenger para usar nas campanhas.
            </p>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 mt-1">
              <Plus size={14} /> Criar template
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((t) => (
              <TemplateCard key={t.id} template={t}
                onSaved={(u) => setTemplates((prev) => prev.map((x) => x.id === u.id ? u : x))}
                onDeleted={(id) => setTemplates((prev) => prev.filter((x) => x.id !== id))} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={(t) => setTemplates((prev) => [...prev, t])} />
      )}
    </>
  )
}
