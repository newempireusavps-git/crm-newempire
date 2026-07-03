import { useState } from 'react'
import { Plus, Trash2, Users, Circle } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import type { Campaign } from '@/types/lead'

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
]

function CreateCampaignModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: Pick<Campaign, 'name' | 'description' | 'color'>) => Promise<Campaign>
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome obrigatório'); return }
    setSaving(true)
    try {
      await onCreate({ name: name.trim(), description: description.trim() || null, color })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar campanha')
    } finally {
      setSaving(false)
    }
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
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Promoção Inverno 2025"
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivo desta campanha…"
              rows={2}
              className="w-full bg-empire-navy border border-empire-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-empire-gold/60 placeholder:text-gray-600 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? 'white' : 'transparent',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-empire-border text-gray-400 text-sm hover:text-white hover:border-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Criando…' : 'Criar Campanha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CampaignsTable() {
  const { campaigns, loading, create, remove } = useCampaigns()
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function handleDelete(id: string) {
    await remove(id)
    setConfirmDelete(null)
  }

  return (
    <>
      <div className="bg-empire-card border border-empire-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-empire-border flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Campanhas de Nutrição</h3>
            <p className="text-gray-500 text-sm mt-0.5">
              {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''} ativa{campaigns.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors"
          >
            <Plus size={15} />
            Nova
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
              Crie campanhas para organizar leads e disparar fluxos de nutrição.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-empire-gold text-empire-dark text-sm font-semibold hover:bg-empire-gold/90 transition-colors mt-1"
            >
              <Plus size={15} />
              Criar primeira campanha
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
                  <th className="text-right text-gray-400 px-5 py-3 font-medium text-xs uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-empire-border">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-empire-navy/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Circle size={10} fill={c.color} stroke="none" style={{ color: c.color }} />
                        <span className="text-white font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-400 max-w-[200px] truncate">
                      {c.description || '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-gray-300">
                        <Users size={13} />
                        {c.lead_count ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {confirmDelete === c.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-400">Confirmar?</span>
                          <button
                            onClick={() => void handleDelete(c.id)}
                            className="text-xs text-red-400 hover:text-red-300 font-medium"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs text-gray-500 hover:text-gray-300"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(c.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCampaignModal onClose={() => setShowCreate(false)} onCreate={create} />
      )}
    </>
  )
}
