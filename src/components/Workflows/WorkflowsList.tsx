import { useState } from 'react'
import { RefreshCw, ExternalLink, Play, Square, AlertCircle, Key, Search, Zap, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { N8nWorkflow } from '@/hooks/useN8nWorkflows'

const N8N_BASE = 'https://n8n-n8n.ixiqur.easypanel.host'

interface Props {
  workflows: N8nWorkflow[]
  loading: boolean
  error: string | null
  apiKey: string
  onSaveApiKey: (key: string) => void
  onRefresh: () => void
  onToggle: (id: string, active: boolean) => Promise<boolean>
}

export function WorkflowsList({
  workflows,
  loading,
  error,
  apiKey,
  onSaveApiKey,
  onRefresh,
  onToggle,
}: Props) {
  const [keyInput, setKeyInput] = useState(apiKey)
  const [toggling, setToggling] = useState<string | null>(null)
  const [showKeyInput, setShowKeyInput] = useState(!apiKey)
  const [search, setSearch] = useState('')

  const filtered = workflows.filter((wf) =>
    wf.name.toLowerCase().includes(search.toLowerCase())
  )
  const activeCount = workflows.filter((w) => w.active).length

  async function handleToggle(id: string, active: boolean) {
    setToggling(id)
    await onToggle(id, active)
    setToggling(null)
  }

  function handleSaveKey() {
    onSaveApiKey(keyInput.trim())
    setShowKeyInput(false)
  }

  return (
    <div className="bg-empire-card rounded-xl border border-empire-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-empire-border">
        <div>
          <h2 className="text-white font-semibold">Workflows n8n</h2>
          <p className="text-empire-muted text-xs mt-0.5">
            {workflows.length > 0
              ? `${workflows.length} workflow${workflows.length !== 1 ? 's' : ''} · ${activeCount} ativo${activeCount !== 1 ? 's' : ''}`
              : 'Gerencie e ative automações diretamente do CRM'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyInput((v) => !v)}
            className="p-2 rounded-lg text-empire-muted hover:text-empire-gold hover:bg-empire-gold/10 transition-colors"
            title="Configurar API Key"
          >
            <Key size={16} />
          </button>
          <button
            onClick={onRefresh}
            disabled={loading || !apiKey}
            className="p-2 rounded-lg text-empire-muted hover:text-white hover:bg-empire-card transition-colors disabled:opacity-40"
            title="Atualizar"
          >
            <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
          </button>
          <a
            href={N8N_BASE}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-empire-muted hover:text-empire-gold hover:bg-empire-gold/10 transition-colors"
            title="Abrir n8n"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* API Key input */}
      {showKeyInput && (
        <div className="px-5 py-3 border-b border-empire-border bg-empire-dark/40">
          <p className="text-empire-muted text-xs mb-2">
            Insira a API Key do n8n (Settings → API → Create API Key)
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="n8n_api_..."
              className="flex-1 bg-empire-dark border border-empire-border rounded-lg px-3 py-2 text-white text-sm placeholder:text-empire-muted focus:outline-none focus:border-empire-gold"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
            />
            <button
              onClick={handleSaveKey}
              className="px-4 py-2 bg-empire-gold text-empire-dark font-medium text-sm rounded-lg hover:opacity-90"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-5 py-3 border-b border-empire-border bg-red-500/5">
          <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            {error === 'cors' ? (
              <span className="text-yellow-300">
                <strong>CORS bloqueado:</strong> o n8n não permite chamadas diretas do browser.{' '}
                <a
                  href={`${N8N_BASE}/settings/api`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-empire-gold"
                >
                  Abra o n8n diretamente
                </a>{' '}
                para gerenciar. O chat de teste continua disponível abaixo.
              </span>
            ) : error === 'unauthorized' ? (
              <span className="text-red-300">API Key inválida ou sem permissão.</span>
            ) : (
              <span className="text-red-300">Erro ao conectar: {error}</span>
            )}
          </div>
        </div>
      )}

      {/* No key */}
      {!apiKey && !showKeyInput && (
        <div className="px-5 py-10 text-center text-empire-muted text-sm">
          Configure a API Key do n8n para visualizar os workflows.
        </div>
      )}

      {/* Search + Cards */}
      {apiKey && (
        <div className="p-5 space-y-4">
          {/* Search bar */}
          {workflows.length > 0 && (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-empire-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar workflows..."
                className="w-full bg-empire-dark border border-empire-border rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder:text-empire-muted focus:outline-none focus:border-empire-gold/50"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-empire-muted hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-empire-dark/60 animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="py-8 text-center text-empire-muted text-sm">
              {search ? `Nenhum workflow encontrado para "${search}"` : 'Nenhum workflow encontrado.'}
            </div>
          )}

          {/* Cards grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((wf) => (
                <WorkflowCard
                  key={wf.id}
                  workflow={wf}
                  toggling={toggling === wf.id}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WorkflowCard({
  workflow: wf,
  toggling,
  onToggle,
}: {
  workflow: N8nWorkflow
  toggling: boolean
  onToggle: (id: string, active: boolean) => void
}) {
  return (
    <div className="group relative flex flex-col gap-3 p-4 rounded-xl bg-empire-dark border border-empire-border hover:border-empire-border/80 hover:bg-empire-dark/80 transition-all">
      {/* Top row: status + external link */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
            wf.active ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              wf.active ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
            )}
          />
          {wf.active ? 'Ativo' : 'Inativo'}
        </span>

        <a
          href={`${N8N_BASE}/workflow/${wf.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-empire-muted hover:text-empire-gold hover:bg-empire-gold/10 transition-colors opacity-0 group-hover:opacity-100"
          title="Abrir no n8n"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Name */}
      <div className="flex-1">
        <p className="text-white text-sm font-medium leading-snug line-clamp-2">{wf.name}</p>
      </div>

      {/* Footer: last updated + toggle */}
      <div className="flex items-center justify-between pt-1 border-t border-empire-border/50">
        <div className="flex items-center gap-1.5 text-empire-muted text-xs">
          <Clock size={11} />
          {new Date(wf.updatedAt).toLocaleDateString('pt-BR')}
        </div>

        <button
          onClick={() => onToggle(wf.id, wf.active)}
          disabled={toggling}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
            wf.active
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20',
            toggling && 'opacity-50 cursor-not-allowed'
          )}
        >
          {toggling ? (
            <Zap size={11} className="animate-pulse" />
          ) : wf.active ? (
            <Square size={11} />
          ) : (
            <Play size={11} />
          )}
          {toggling ? '...' : wf.active ? 'Desativar' : 'Ativar'}
        </button>
      </div>
    </div>
  )
}
