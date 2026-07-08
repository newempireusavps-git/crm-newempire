const N8N_BASE = 'https://n8n-n8n.ixiqur.easypanel.host'

// Fires the same webhook the specialist's "Lead Fechado" email button calls —
// generates the contract, saves it, and emails the client. `no-cors` because the
// n8n webhook doesn't return CORS headers; response body isn't needed here.
export async function triggerContractWorkflow(sessionId: string): Promise<void> {
  const url = `${N8N_BASE}/webhook/lead-action?action=fechamento&sessionId=${encodeURIComponent(sessionId)}`
  await fetch(url, { mode: 'no-cors' })
}
