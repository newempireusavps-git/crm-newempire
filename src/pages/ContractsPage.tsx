import { useState, useEffect, useMemo } from 'react'
import { FileSignature, Clock, CheckCircle2, Loader2, MapPin, Wrench, Calendar, Mail } from 'lucide-react'
import { fetchContracts } from '@/lib/supabase'
import type { Contract } from '@/types/lead'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Contract | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchContracts()
      .then(setContracts)
      .finally(() => setLoading(false))
  }, [])

  const pending = useMemo(() => contracts.filter((c) => c.status !== 'signed'), [contracts])
  const signed = useMemo(() => contracts.filter((c) => c.status === 'signed'), [contracts])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Contratos</h1>
        <p className="text-gray-500 text-sm mt-1">Acompanhe contratos enviados e assinados pelos clientes.</p>
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
    </div>
  )
}
