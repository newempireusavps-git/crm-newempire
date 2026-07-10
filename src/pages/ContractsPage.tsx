import { useState, useEffect, useMemo } from 'react'
import { FileSignature, Clock, CheckCircle2, Loader2, MapPin, Wrench, Calendar, Mail, Plus, X, Download } from 'lucide-react'
import { fetchContracts } from '@/lib/supabase'
import type { Contract } from '@/types/lead'
import { SERVICE_TYPES } from '@/types/lead'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const MANUAL_CONTRACT_WEBHOOK = 'https://n8n-n8n.ixiqur.easypanel.host/webhook/manual-contract'
const DEFAULT_PAYMENT_TERMS = '50% deposit due upon signing this agreement. Remaining 50% balance due upon substantial completion of the work.'

interface ContractFormState {
  client_name: string
  client_email: string
  property_address: string
  service_type: string
  services: string
  start_date: string
  completion_date: string
  payment_terms: string
}

const emptyForm: ContractFormState = {
  client_name: '',
  client_email: '',
  property_address: '',
  service_type: SERVICE_TYPES[0],
  services: '',
  start_date: '',
  completion_date: '',
  payment_terms: DEFAULT_PAYMENT_TERMS,
}

function stripHtml(html: string | null): string {
  if (!html) return ''
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function ContractCard({ contract, onView }: { contract: Contract; onView: (c: Contract) => void }) {
  const isSigned = contract.status === 'signed'
  let services: string[] = []
  try { services = JSON.parse(contract.services_description ?? '[]') } catch { /* not JSON */ }

  return (
    <button
      onClick={() => onView(contract)}
      className="w-full text-left bg-empire-navy border border-empire-border rounded-lg p-4 hover:border-empire-gold/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-white text-sm font-semibold">{contract.client_name}</p>
        <span className={`text-xs border rounded-full px-2 py-0.5 shrink-0 flex items-center gap-1 ${
          isSigned
            ? 'text-green-400 bg-green-400/10 border-green-400/20'
            : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
        }`}>
          {isSigned ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          {isSigned ? 'Assinado' : 'Pendente'}
        </span>
      </div>
      <div className="space-y-1 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Wrench size={11} className="shrink-0" />
          <span>{contract.service_type}</span>
        </div>
        {contract.property_address && (
          <div className="flex items-center gap-1.5">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{contract.property_address}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Mail size={11} className="shrink-0" />
          <span className="truncate">{contract.client_email}</span>
        </div>
        {services.length > 0 && (
          <p className="text-gray-500 line-clamp-1 mt-1">{services.join(', ')}</p>
        )}
      </div>
      <p className="text-gray-600 text-xs mt-2">
        {isSigned && contract.signed_at
          ? `Assinado em ${formatDate(contract.signed_at)}`
          : `Enviado em ${formatDate(contract.created_at)}`}
      </p>
    </button>
  )
}

function ContractGeneratorModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: () => void }) {
  const [form, setForm] = useState<ContractFormState>(emptyForm)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_name.trim() || !form.client_email.trim()) {
      setError('Nome e e-mail do cliente são obrigatórios')
      return
    }
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(MANUAL_CONTRACT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          services: form.services.split('\n').map((s) => s.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) throw new Error(`Erro ao gerar contrato (${res.status})`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato - ${form.client_name}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      onGenerated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar contrato')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-empire-card border border-empire-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-empire-border flex items-center justify-between shrink-0">
          <h2 className="text-white font-semibold">Gerar Novo Contrato</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={(e) => void handleGenerate(e)} className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Nome do cliente *</label>
              <input value={form.client_name} onChange={(e) => update('client_name', e.target.value)}
                className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">E-mail *</label>
              <input type="email" value={form.client_email} onChange={(e) => update('client_email', e.target.value)}
                className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Endereço do imóvel</label>
            <input value={form.property_address} onChange={(e) => update('property_address', e.target.value)}
              placeholder="Rua, cidade"
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Tipo de serviço</label>
            <select value={form.service_type} onChange={(e) => update('service_type', e.target.value)}
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60">
              {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Serviços incluídos (um por linha)</label>
            <textarea value={form.services} onChange={(e) => update('services', e.target.value)} rows={3}
              placeholder={'Cabinet box and frame painting\nCabinet door and drawer front painting'}
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600 resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Data de início</label>
              <input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)}
                className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Data de conclusão</label>
              <input type="date" value={form.completion_date} onChange={(e) => update('completion_date', e.target.value)}
                className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Condições de pagamento</label>
            <textarea value={form.payment_terms} onChange={(e) => update('payment_terms', e.target.value)} rows={2}
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 resize-none" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-empire-border text-gray-400 text-sm hover:text-white transition-colors">Cancelar</button>
            <button type="submit" disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 disabled:opacity-50 transition-colors">
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {generating ? 'Gerando…' : 'Gerar PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Contract | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)

  function loadContracts() {
    setLoading(true)
    return fetchContracts()
      .then(setContracts)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadContracts()
  }, [])

  const pending = useMemo(() => contracts.filter((c) => c.status !== 'signed'), [contracts])
  const signed = useMemo(() => contracts.filter((c) => c.status === 'signed'), [contracts])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-bold">Contratos</h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe contratos enviados e assinados pelos clientes.</p>
        </div>
        <button onClick={() => setShowGenerator(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors shrink-0">
          <Plus size={15} /> Novo Contrato
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-empire-card border border-yellow-500/30 rounded-xl p-5 flex items-center gap-4">
          <div className="text-yellow-400 p-3 bg-empire-navy rounded-lg"><Clock size={22} /></div>
          <div>
            <p className="text-gray-400 text-sm">Contratos Pendentes</p>
            <p className="text-white text-2xl font-bold mt-0.5">{pending.length}</p>
          </div>
        </div>
        <div className="bg-empire-card border border-green-500/30 rounded-xl p-5 flex items-center gap-4">
          <div className="text-green-400 p-3 bg-empire-navy rounded-lg"><CheckCircle2 size={22} /></div>
          <div>
            <p className="text-gray-400 text-sm">Contratos Assinados</p>
            <p className="text-white text-2xl font-bold mt-0.5">{signed.length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-empire-muted text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Carregando contratos…
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-empire-card border border-empire-border rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <FileSignature size={40} className="text-empire-muted" />
          <p className="text-white font-medium">Nenhum contrato ainda</p>
          <p className="text-empire-muted text-sm text-center max-w-xs">
            Contratos aparecem aqui automaticamente quando um especialista marca um lead como "Fechado".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending */}
          <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-empire-border flex items-center gap-2">
              <Clock size={16} className="text-yellow-400" />
              <h3 className="text-white font-semibold">Contratos Pendentes</h3>
              <span className="text-gray-500 text-xs">({pending.length})</span>
            </div>
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {pending.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-8">Nenhum contrato pendente 🎉</p>
              ) : (
                pending.map((c) => <ContractCard key={c.id} contract={c} onView={setSelected} />)
              )}
            </div>
          </div>

          {/* Signed */}
          <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-empire-border flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              <h3 className="text-white font-semibold">Contratos Assinados</h3>
              <span className="text-gray-500 text-xs">({signed.length})</span>
            </div>
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {signed.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-8">Nenhum contrato assinado ainda</p>
              ) : (
                signed.map((c) => <ContractCard key={c.id} contract={c} onView={setSelected} />)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          {selected && (
            <>
              <DialogHeader className="shrink-0">
                <DialogTitle>{selected.client_name}</DialogTitle>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className={`border rounded-full px-2 py-0.5 flex items-center gap-1 ${
                    selected.status === 'signed'
                      ? 'text-green-400 bg-green-400/10 border-green-400/20'
                      : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                  }`}>
                    {selected.status === 'signed' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                    {selected.status === 'signed' ? 'Assinado' : 'Pendente'}
                  </span>
                  <span className="text-empire-muted flex items-center gap-1">
                    <Calendar size={11} /> {formatDate(selected.created_at)}
                  </span>
                </div>
              </DialogHeader>
              <div className="overflow-y-auto space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-empire-muted">E-mail</p>
                    <p className="text-gray-300">{selected.client_email}</p>
                  </div>
                  <div>
                    <p className="text-empire-muted">Serviço</p>
                    <p className="text-gray-300">{selected.service_type}</p>
                  </div>
                  {selected.property_address && (
                    <div className="col-span-2">
                      <p className="text-empire-muted">Endereço</p>
                      <p className="text-gray-300">{selected.property_address}</p>
                    </div>
                  )}
                  {selected.signer_name && (
                    <div>
                      <p className="text-empire-muted">Assinado por</p>
                      <p className="text-gray-300">{selected.signer_name}</p>
                    </div>
                  )}
                  {selected.signed_at && (
                    <div>
                      <p className="text-empire-muted">Data da assinatura</p>
                      <p className="text-gray-300">{formatDate(selected.signed_at)}</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-empire-border pt-3">
                  <p className="text-empire-muted text-xs uppercase tracking-wide mb-2">Texto do contrato</p>
                  <pre className="text-gray-300 text-xs whitespace-pre-wrap font-sans leading-relaxed bg-empire-navy border border-empire-border rounded-lg p-3">
                    {stripHtml(selected.signed_html ?? selected.contract_html) || 'Sem conteúdo disponível.'}
                  </pre>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {showGenerator && (
        <ContractGeneratorModal onClose={() => setShowGenerator(false)} onGenerated={loadContracts} />
      )}
    </div>
  )
}
