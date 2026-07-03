import { useState, useEffect, useCallback } from 'react'
import { fetchLeadActivities } from '@/lib/supabase'
import type { LeadActivity } from '@/types/lead'

export function useLeadActivities(leadId: string | null) {
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!leadId) return
    setLoading(true)
    try {
      setActivities(await fetchLeadActivities(leadId))
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => { void load() }, [load])

  return { activities, loading, refetch: load }
}
