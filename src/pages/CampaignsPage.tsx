import { CampaignsTable } from '@/components/Campaigns/CampaignsTable'

export function CampaignsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white text-2xl font-bold">Campanhas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie campanhas de nutrição e classifique leads em fluxos personalizados.
        </p>
      </div>
      <CampaignsTable />
    </div>
  )
}
