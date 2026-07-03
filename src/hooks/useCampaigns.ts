import { useState, useEffect, useCallback } from 'react'
import { fetchCampaigns, createCampaign, deleteCampaign } from '@/lib/supabase'
import type { Campaign } from '@/types/lead'

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCampaigns(await fetchCampaigns())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const create = useCallback(
    async (data: Pick<Campaign, 'name' | 'description' | 'color'>) => {
      const created = await createCampaign(data)
      setCampaigns((prev) => [{ ...created, lead_count: 0 }, ...prev])
      return created
    },
    [],
  )

  const remove = useCallback(async (id: string) => {
    await deleteCampaign(id)
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return { campaigns, loading, error, refetch: load, create, remove }
}
