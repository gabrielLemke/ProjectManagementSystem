import { FolderKanban, LayoutDashboard, LogOut, ChevronDown, Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getInitials } from '../lib/utils'
import { useState } from 'react'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export type Page = 'dashboard' | 'projects'

const navItems: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'projects', label: 'Projetos', icon: FolderKanban },
]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth()

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col md:h-screen md:sticky md:top-0 shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white block leading-none">ProjectMS</span>
            <span className="text-xs text-slate-400">v1.0</span>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex md:flex-col gap-1 p-2 md:p-4 overflow-x-auto">
        {navItems.map(({ page, label, icon: Icon }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition ${
              currentPage === page
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Usuário */}
      <div className="hidden md:block p-4 border-t border-slate-800 mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user ? getInitials(user.name) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sair"
            className="text-slate-500 hover:text-red-400 transition p-1 rounded"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const { logout } = useAuth()

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="font-bold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition">
          <Bell className="w-4 h-4" />
        </button>
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
              {user ? getInitials(user.name) : '?'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 py-1">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
