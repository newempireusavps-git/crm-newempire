import { WorkflowsList } from '@/components/Workflows/WorkflowsList'
import { useN8nWorkflows } from '@/hooks/useN8nWorkflows'

export function WorkflowsPage() {
  const { workflows, loading, error, apiKey, saveApiKey, fetchWorkflows, toggleWorkflow } =
    useN8nWorkflows()

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Workflows</h1>
        <p className="text-empire-muted text-sm mt-1">
          Gerencie automações n8n diretamente do CRM
        </p>
      </div>

      {/* Workflows list */}
      <WorkflowsList
        workflows={workflows}
        loading={loading}
        error={error}
        apiKey={apiKey}
        onSaveApiKey={saveApiKey}
        onRefresh={fetchWorkflows}
        onToggle={toggleWorkflow}
      />
    </div>
  )
}
