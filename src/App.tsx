import { useState, useCallback } from 'react'
import { Sidebar, type Page } from '@/components/Layout/Sidebar'
import { GlobalFilters } from '@/components/Layout/GlobalFilters'
import { DashboardPage } from '@/pages/DashboardPage'
import { PipelinePage } from '@/pages/PipelinePage'
import { InsightsPage } from '@/pages/InsightsPage'
import { CampaignsPage } from '@/pages/CampaignsPage'
import { LeadsPage } from '@/pages/LeadsPage'
import { ActivitiesPage } from '@/pages/ActivitiesPage'
import { WorkflowsPage } from '@/pages/WorkflowsPage'
import { TemplatesPage } from '@/pages/TemplatesPage'
import { FilterProvider } from '@/context/FilterContext'
import { Toast, useToast } from '@/components/ui/toast'
import { useLeads } from '@/hooks/useLeads'
import type { Lead } from '@/types/lead'

function AppInner() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const { leads: rawLeads, loading, refetch } = useLeads()
  const [localLeads, setLocalLeads] = useState<Lead[] | null>(null)
  const { toast, showToast, hideToast } = useToast()

  const leads = localLeads ?? rawLeads

  const handleRefresh = useCallback(async () => {
    setLocalLeads(null)
    await refetch()
    showToast('Dados atualizados com sucesso!')
  }, [refetch, showToast])

  const handleLeadsChange = useCallback((updated: Lead[]) => {
    setLocalLeads(updated)
  }, [])

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-empire-dark">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="flex-1 flex flex-col min-w-0">
        {activePage === 'dashboard' && <GlobalFilters leads={rawLeads} />}

        <main className="flex-1 p-3 md:p-6 overflow-auto">
          {activePage === 'dashboard'   && <DashboardPage leads={leads} loading={loading} onRefresh={handleRefresh} />}
          {activePage === 'pipeline'    && <PipelinePage leads={leads} onLeadsChange={handleLeadsChange} />}
          {activePage === 'insights'    && <InsightsPage leads={leads} />}
          {activePage === 'campanhas'   && <CampaignsPage />}
          {activePage === 'leads'       && <LeadsPage leads={leads} loading={loading} onLeadAdded={(l) => handleLeadsChange([l, ...leads])} />}
          {activePage === 'atividades'  && <ActivitiesPage />}
          {activePage === 'workflows'   && <WorkflowsPage />}
          {activePage === 'templates'   && <TemplatesPage />}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}

function App() {
  return (
    <FilterProvider>
      <AppInner />
    </FilterProvider>
  )
}

export default App
