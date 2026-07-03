import { useState, useEffect, useCallback } from 'react'

// Use Vite dev proxy (/n8n-api → https://n8n-n8n.ixiqur.easypanel.host) to bypass CORS
const N8N_BASE = '/n8n-api'
const API_KEY_STORAGE = 'n8n_api_key'

export interface N8nWorkflow {
  id: string
  name: string
  active: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
  triggerCount: number
}

export type FetchError = 'cors' | 'unauthorized' | 'network' | string

export function useN8nWorkflows() {
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<FetchError | null>(null)
  const [apiKey, setApiKeyState] = useState<string>(
    () => localStorage.getItem(API_KEY_STORAGE) ?? ''
  )

  const saveApiKey = useCallback((key: string) => {
    localStorage.setItem(API_KEY_STORAGE, key)
    setApiKeyState(key)
  }, [])

  const headers = useCallback(
    () => ({ 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' }),
    [apiKey]
  )

  const fetchWorkflows = useCallback(async () => {
    if (!apiKey) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${N8N_BASE}/api/v1/workflows?limit=50`, {
        headers: headers(),
        mode: 'cors',
      })
      if (res.status === 401 || res.status === 403) {
        setError('unauthorized')
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list: N8nWorkflow[] = (data.data ?? []).filter(
        (w: N8nWorkflow) => !w.isArchived
      )
      setWorkflows(list)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      // TypeError with "fetch" in the message is usually a CORS or network failure
      if (e instanceof TypeError || msg.toLowerCase().includes('fetch')) {
        setError('cors')
      } else {
        setError(msg || 'network')
      }
    } finally {
      setLoading(false)
    }
  }, [apiKey, headers])

  const toggleWorkflow = useCallback(
    async (id: string, currentlyActive: boolean) => {
      const action = currentlyActive ? 'deactivate' : 'activate'
      try {
        const res = await fetch(`${N8N_BASE}/api/v1/workflows/${id}/${action}`, {
          method: 'POST',
          headers: headers(),
          mode: 'cors',
        })
        if (!res.ok) return false
        setWorkflows((prev) =>
          prev.map((w) => (w.id === id ? { ...w, active: !currentlyActive } : w))
        )
        return true
      } catch {
        return false
      }
    },
    [headers]
  )

  useEffect(() => {
    if (apiKey) fetchWorkflows()
  }, [apiKey, fetchWorkflows])

  return { workflows, loading, error, apiKey, saveApiKey, fetchWorkflows, toggleWorkflow }
}
