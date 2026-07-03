import { LayoutDashboard, Kanban, BarChart2, Megaphone, Users, Clock, Workflow, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

type Page = 'dashboard' | 'pipeline' | 'insights' | 'campanhas' | 'leads' | 'atividades' | 'workflows' | 'templates'

interface SidebarProps {
  activePage: Page
  onNavigate: (page: Page) => void
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',  label: 'Dashboard',   icon: <LayoutDashboard size={20} /> },
  { id: 'pipeline',   label: 'Pipeline',    icon: <Kanban size={20} /> },
  { id: 'insights',   label: 'Insights',    icon: <BarChart2 size={20} /> },
  { id: 'campanhas',  label: 'Campanhas',   icon: <Megaphone size={20} /> },
  { id: 'leads',      label: 'Leads',       icon: <Users size={20} /> },
  { id: 'atividades', label: 'Atividades',  icon: <Clock size={20} /> },
  { id: 'workflows',  label: 'Workflows',   icon: <Workflow size={20} /> },
  { id: 'templates',  label: 'Templates',   icon: <FileText size={20} /> },
]

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="flex flex-col w-60 min-h-screen bg-empire-navy border-r border-empire-border shrink-0">
      <div className="flex flex-col items-center gap-1 px-6 py-6 border-b border-empire-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-empire-gold flex items-center justify-center">
            <span className="text-empire-dark font-bold text-sm">NE</span>
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm leading-tight">New Empire</p>
            <p className="text-empire-gold text-xs leading-tight">Remodeling CRM</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activePage === item.id
                ? 'bg-empire-gold/10 text-empire-gold border border-empire-gold/30'
                : 'text-gray-400 hover:text-white hover:bg-empire-card',
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-empire-border">
        <p className="text-empire-muted text-xs text-center">CRM New Empire v1.0</p>
      </div>
    </aside>
  )
}

export type { Page }
