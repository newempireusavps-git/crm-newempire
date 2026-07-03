import { useState, useEffect, useRef } from 'react'
import { Save, Eye, EyeOff, Mail, MessageSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { EmailTemplate } from '@/types/lead'
import { fetchEmailTemplates, updateEmailTemplate } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  nurture_day1:         <Mail size={16} />,
  nurture_day7_whatsapp:<MessageSquare size={16} />,
  nurture_day7_social:  <MessageSquare size={16} />,
}

const IS_HTML: Record<string, boolean> = {
  nurture_day1: true,
  nurture_day7_whatsapp: false,
  nurture_day7_social: false,
}

function PreviewPane({ html, isHtml }: { html: string; isHtml: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!isHtml || !iframeRef.current) return
    const doc = iframeRef.current.contentDocument
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()
  }, [html, isHtml])

  if (!isHtml) {
    return (
      <pre className="w-full h-full p-4 bg-white text-gray-800 text-sm whitespace-pre-wrap rounded-lg overflow-auto font-sans leading-relaxed">
        {html}
      </pre>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full rounded-lg border-0 bg-white"
      title="Email preview"
      sandbox="allow-same-origin"
    />
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

  const isHtml = IS_HTML[template.template_key] ?? false
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Meta fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Descrição</label>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Opcional"
            className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Subject (only meaningful for email) */}
      {isHtml && (
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Assunto do Email</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60"
          />
        </div>
      )}

      {/* Hint about {{first_name}} */}
      <p className="text-xs text-gray-500">
        Use <code className="text-empire-gold bg-empire-navy px-1 rounded">{'{{first_name}}'}</code> para inserir o nome do lead automaticamente.
      </p>

      {/* Editor + Preview toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400 uppercase tracking-wide">
          {isHtml ? 'Código HTML' : 'Mensagem'}
        </label>
        {isHtml && (
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
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
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={isHtml ? 20 : 10}
          spellCheck={false}
          className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 font-mono resize-y"
        />
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-green-400 text-xs">Salvo com sucesso ✓</span>}
        <button
          onClick={() => void handleSave()}
          disabled={saving || !dirty}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
            dirty
              ? 'bg-empire-gold text-empire-dark hover:bg-empire-gold/90'
              : 'bg-empire-card text-gray-500 cursor-not-allowed border border-empire-border',
          )}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function TemplateCard({ template, onSaved }: { template: EmailTemplate; onSaved: (t: EmailTemplate) => void }) {
  const [open, setOpen] = useState(false)
  const isHtml = IS_HTML[template.template_key] ?? false

  return (
    <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-empire-navy/40 transition-colors"
      >
        <span className="text-empire-gold">
          {CHANNEL_ICON[template.template_key] ?? <Mail size={16} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">{template.name}</p>
          {template.description && (
            <p className="text-gray-500 text-xs mt-0.5 truncate">{template.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full border',
            isHtml
              ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
              : 'text-purple-400 border-purple-400/30 bg-purple-400/10',
          )}>
            {isHtml ? 'HTML' : 'Texto'}
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

export function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    fetchEmailTemplates()
      .then(setTemplates)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar templates'))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(updated: EmailTemplate) {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Templates de Mensagens</h1>
        <p className="text-gray-400 text-sm mt-1">
          Edite os textos enviados nos fluxos de nutrição e follow-up. As alterações são aplicadas imediatamente — sem precisar acessar o n8n.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12">
          <Loader2 size={16} className="animate-spin" /> Carregando templates…
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onSaved={handleSaved} />
          ))}
        </div>
      )}
    </div>
  )
}
