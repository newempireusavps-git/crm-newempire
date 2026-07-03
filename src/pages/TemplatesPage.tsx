import { useState, useEffect, useRef } from 'react'
import { Save, Eye, EyeOff, Mail, MessageSquare, AtSign, Share2, Phone,
         ChevronDown, ChevronUp, Loader2, Plus, X } from 'lucide-react'
import type { EmailTemplate, CampaignChannel } from '@/types/lead'
import { fetchEmailTemplates, updateEmailTemplate, createEmailTemplate } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const CHANNEL_META: Record<CampaignChannel, { label: string; icon: React.ReactNode; color: string }> = {
  email:     { label: 'Email',     icon: <Mail size={14} />,          color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
  whatsapp:  { label: 'WhatsApp',  icon: <MessageSquare size={14} />, color: 'text-green-400 border-green-400/30 bg-green-400/10' },
  sms:       { label: 'SMS',       icon: <Phone size={14} />,         color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
  instagram: { label: 'Instagram', icon: <AtSign size={14} />,        color: 'text-pink-400 border-pink-400/30 bg-pink-400/10' },
  facebook:  { label: 'Facebook',  icon: <Share2 size={14} />,        color: 'text-indigo-400 border-indigo-400/30 bg-indigo-400/10' },
}

function PreviewPane({ html, isHtml }: { html: string; isHtml: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!isHtml || !iframeRef.current) return
    const doc = iframeRef.current.contentDocument
    if (!doc) return
    doc.open(); doc.write(html); doc.close()
  }, [html, isHtml])

  if (!isHtml) {
    return (
      <pre className="w-full h-full p-4 bg-white text-gray-800 text-sm whitespace-pre-wrap rounded-lg overflow-auto font-sans leading-relaxed">
        {html}
      </pre>
    )
  }

  return (
    <iframe ref={iframeRef} className="w-full h-full rounded-lg border-0 bg-white"
      title="Email preview" sandbox="allow-same-origin" />
  )
}

function TemplateEditor({ template, onSaved }: { template: EmailTemplate; onSaved: (t: EmailTemplate) => void }) {
  const [name, setName]       = useState(template.name)
  const [desc, setDesc]       = useState(template.description ?? '')
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody]       = useState(template.html_body)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  const isHtml = template.channel === 'email'
  const dirty = name !== template.name || desc !== (template.description ?? '') ||
                subject !== template.subject || body !== template.html_body

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await updateEmailTemplate(template.id, {
        name: name.trim(),
        description: desc.trim() || null,
        subject: subject.trim(),
        html_body: body,
      })
      onSaved({ ...template, name: name.trim(), description: desc.trim() || null, subject: subject.trim(), html_body: body })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally { setSaving(false) }
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

      {isHtml && (
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Assunto do Email</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60" />
        </div>
      )}

      <p className="text-xs text-gray-500">
        Use <code className="text-empire-gold bg-empire-navy px-1 rounded">{'{{first_name}}'}</code> para inserir o nome do lead automaticamente.
      </p>

      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400 uppercase tracking-wide">
          {isHtml ? 'Código HTML' : 'Mensagem'}
        </label>
        {isHtml && (
          <button type="button" onClick={() => setPreview((p) => !p)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            {preview ? <EyeOff size={13} /> : <Eye size={13} />}
            {preview ? 'Editar' : 'Visualizar'}
          </button>
        )}
      </div>

      {preview && isHtml ? (
        <div className="h-[480px] rounded-lg overflow-hidden border border-empire-border">
          <PreviewPane html={body} isHtml={isHtml} />
        </div>
      ) : (
        <textarea value={body} onChange={(e) => setBody(e.target.value)}
          rows={isHtml ? 20 : 10} spellCheck={false}
          className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 font-mono resize-y" />
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-green-400 text-xs">Salvo com sucesso ✓</span>}
        <button onClick={() => void handleSave()} disabled={saving || !dirty}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
            dirty
              ? 'bg-empire-gold text-empire-dark hover:bg-empire-gold/90'
              : 'bg-empire-card text-gray-500 cursor-not-allowed border border-empire-border',
          )}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function TemplateCard({ template, onSaved }: { template: EmailTemplate; onSaved: (t: EmailTemplate) => void }) {
  const [open, setOpen] = useState(false)
  const ch = (template.channel ?? 'email') as CampaignChannel
  const meta = CHANNEL_META[ch]

  return (
    <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-empire-navy/40 transition-colors">
        <span className="text-empire-gold">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">{template.name}</p>
          {template.description && (
            <p className="text-gray-500 text-xs mt-0.5 truncate">{template.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('text-xs px-2 py-0.5 rounded-full border', meta.color)}>
            {meta.label}
          </span>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-empire-border pt-4">
          <TemplateEditor template={template} onSaved={onSaved} />
        </div>
      )}
    </div>
  )
}

// ─── Create Template Modal ────────────────────────────────────────────────────
function CreateTemplateModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (t: EmailTemplate) => void
}) {
  const [name, setName]       = useState('')
  const [desc, setDesc]       = useState('')
  const [channel, setChannel] = useState<CampaignChannel>('email')
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const isHtml = channel === 'email'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome obrigatório'); return }
    setSaving(true)
    setError('')
    try {
      const created = await createEmailTemplate({
        name: name.trim(),
        description: desc.trim() || null,
        channel,
        subject: subject.trim() || name.trim(),
        html_body: body,
        template_key: `custom_${Date.now()}`,
        is_active: true,
      })
      onCreate(created)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar template')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-empire-card border border-empire-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-empire-border flex items-center justify-between sticky top-0 bg-empire-card z-10">
          <h2 className="text-white font-semibold">Novo Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Nome *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: WhatsApp Boas-vindas"
                className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Canal</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value as CampaignChannel)}
                className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60">
                {(Object.keys(CHANNEL_META) as CampaignChannel[]).map((c) => (
                  <option key={c} value={c}>{CHANNEL_META[c].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Descrição</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Opcional"
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600" />
          </div>

          {isHtml && (
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Assunto do Email</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Sua cozinha transformada — New Empire Remodeling"
                className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600" />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">
              {isHtml ? 'Conteúdo HTML' : 'Mensagem'}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Use <code className="text-empire-gold bg-empire-navy px-1 rounded">{'{{first_name}}'}</code> para o nome do lead.
            </p>
            <textarea value={body} onChange={(e) => setBody(e.target.value)}
              rows={isHtml ? 14 : 6} spellCheck={false}
              placeholder={isHtml ? '<p>Olá {{first_name}},</p>' : 'Olá {{first_name}}, tudo bem?'}
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 font-mono resize-y placeholder:text-gray-600" />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-empire-border text-gray-400 text-sm hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors disabled:opacity-50">
              {saving ? 'Criando…' : 'Criar Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchEmailTemplates()
      .then(setTemplates)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar templates'))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(updated: EmailTemplate) {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  function handleCreated(t: EmailTemplate) {
    setTemplates((prev) => [...prev, t])
  }

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Templates de Mensagens</h1>
            <p className="text-gray-400 text-sm mt-1">
              Edite os textos enviados nos fluxos. As alterações são aplicadas imediatamente — sem precisar acessar o n8n.
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors shrink-0">
            <Plus size={15} /> Novo
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-12">
            <Loader2 size={16} className="animate-spin" /> Carregando templates…
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Mail size={32} className="text-empire-muted" />
            <p className="text-white font-medium">Nenhum template ainda</p>
            <p className="text-empire-muted text-sm max-w-xs">
              Crie templates de email, WhatsApp, SMS e redes sociais para usar nas campanhas.
            </p>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 mt-1">
              <Plus size={14} /> Criar primeiro template
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} onSaved={handleSaved} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTemplateModal onClose={() => setShowCreate(false)} onCreate={handleCreated} />
      )}
    </>
  )
}
