import { useState } from 'react'
import { LayoutDashboard, Kanban, BarChart2, Megaphone, Users, Clock, Workflow, FileText, FileSignature, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Page = 'dashboard' | 'pipeline' | 'insights' | 'campanhas' | 'leads' | 'atividades' | 'contratos' | 'workflows' | 'templates'

interface SidebarProps {
  activePage: Page
  onNavigate: (page: Page) => void
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: <LayoutDashboard size={20} /> },
  { id: 'pipeline',   label: 'Pipeline',   icon: <Kanban size={20} /> },
  { id: 'insights',   label: 'Insights',   icon: <BarChart2 size={20} /> },
  { id: 'campanhas',  label: 'Campanhas',  icon: <Megaphone size={20} /> },
  { id: 'leads',      label: 'Leads',      icon: <Users size={20} /> },
  { id: 'atividades', label: 'Atividades', icon: <Clock size={20} /> },
  { id: 'contratos',  label: 'Contratos',  icon: <FileSignature size={20} /> },
  { id: 'workflows',  label: 'Workflows',  icon: <Workflow size={20} /> },
  { id: 'templates',  label: 'Templates',  icon: <FileText size={20} /> },
]

// ─── Desktop sidebar (hidden on mobile) ──────────────────────────────────────
function DesktopSidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-empire-navy border-r border-empire-border shrink-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-empire-border">
        <div className="w-8 h-8 rounded-full bg-empire-gold flex items-center justify-center shrink-0">
          <span className="text-empire-dark font-bold text-sm">NE</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">New Empire</p>
          <p className="text-empire-gold text-xs leading-tight">Remodeling CRM</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activePage === item.id
                ? 'bg-empire-gold/10 text-empire-gold border border-empire-gold/30'
                : 'text-gray-400 hover:text-white hover:bg-empire-card',
            )}>
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-empire-border">
        <p className="text-empire-muted text-xs text-center">New Empire CRM v1.0</p>
      </div>
    </aside>
  )
}

// ─── Mobile top bar + drawer ──────────────────────────────────────────────────
function MobileSidebar({ activePage, onNavigate }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const active = navItems.find((i) => i.id === activePage)

  function navigate(page: Page) {
    onNavigate(page)
    setOpen(false)
  }

  return (
    <>
      {/* Top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-empire-navy border-b border-empire-border shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-empire-gold flex items-center justify-center">
            <span className="text-empire-dark font-bold text-xs">NE</span>
          </div>
          <span className="text-white font-bold text-sm">New Empire CRM</span>
        </div>
        <div className="flex items-center gap-2">
          {active && (
            <span className="text-empire-gold text-xs font-medium flex items-center gap-1">
              {active.icon} {active.label}
            </span>
          )}
          <button onClick={() => setOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />
      )}

      {/* Drawer */}
      <div className={cn(
        'md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-empire-navy border-r border-empire-border flex flex-col transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-empire-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-empire-gold flex items-center justify-center">
              <span className="text-empire-dark font-bold text-sm">NE</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">New Empire</p>
              <p className="text-empire-gold text-xs">Remodeling CRM</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => navigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                activePage === item.id
                  ? 'bg-empire-gold/10 text-empire-gold border border-empire-gold/30'
                  : 'text-gray-400 hover:text-white hover:bg-empire-card',
              )}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-empire-border">
          <p className="text-empire-muted text-xs text-center">New Empire CRM v1.0</p>
        </div>
      </div>
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function Sidebar(props: SidebarProps) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  )
}

export type { Page }
