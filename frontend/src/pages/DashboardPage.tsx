import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { Project, Task, PaginatedResponse } from '../types'
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
} from 'lucide-react'
import { formatDate } from '../lib/utils'
import { TopBar } from '../components/Layout'

interface DashboardStats {
  totalProjects: number
  totalTasks: number
  doneTasks: number
  inProgressTasks: number
  overdueTasks: number
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string
  value: number
  icon: typeof FolderKanban
  color: string
  subtitle?: string
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  )
}

function TaskStatusBadge({ status }: { status: Task['status'] }) {
  const map = {
    TODO: { label: 'A Fazer', className: 'bg-slate-700 text-slate-300' },
    IN_PROGRESS: { label: 'Em andamento', className: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
    DONE: { label: 'Concluído', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  }
  const { label, className } = map[status]
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  )
}

function PriorityDot({ priority }: { priority: Task['priority'] }) {
  const colors = {
    LOW: 'bg-slate-400',
    MEDIUM: 'bg-amber-400',
    HIGH: 'bg-red-400',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[priority]}`} />
}

export default function DashboardPage({ onNavigate }: { onNavigate: (p: 'projects') => void }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalTasks: 0,
    doneTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const projectRes = await api.get<PaginatedResponse<Project>>(
          '/api/v1/projects?page=1&limit=50',
        )
        setProjects(projectRes.data)

        const total = projectRes.pagination.total
        const allTasks: Task[] = []

        // Carrega tarefas dos primeiros 5 projetos para montar os stats
        await Promise.all(
          projectRes.data.slice(0, 5).map(async (p) => {
            try {
              const taskRes = await api.get<PaginatedResponse<Task>>(
                `/api/v1/projects/${p.id}/tasks?page=1&limit=50`,
              )
              allTasks.push(...taskRes.data)
            } catch {
              // Projeto sem tarefas ainda
            }
          }),
        )

        const now = new Date()
        setStats({
          totalProjects: total,
          totalTasks: allTasks.length,
          doneTasks: allTasks.filter((t) => t.status === 'DONE').length,
          inProgressTasks: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
          overdueTasks: allTasks.filter(
            (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE',
          ).length,
        })

        setRecentTasks(
          [...allTasks]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5),
        )
      } catch {
        // ignora erros de carregamento inicial
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title={`${greeting()}, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Aqui está um resumo dos seus projetos hoje"
      />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Projetos"
            value={stats.totalProjects}
            icon={FolderKanban}
            color="bg-sky-500/10 text-sky-400"
            subtitle="Total de projetos"
          />
          <StatCard
            title="Tarefas Concluídas"
            value={stats.doneTasks}
            icon={CheckCircle2}
            color="bg-emerald-500/10 text-emerald-400"
            subtitle={`de ${stats.totalTasks} no total`}
          />
          <StatCard
            title="Em Andamento"
            value={stats.inProgressTasks}
            icon={TrendingUp}
            color="bg-violet-500/10 text-violet-400"
            subtitle="Tarefas ativas"
          />
          <StatCard
            title="Atrasadas"
            value={stats.overdueTasks}
            icon={AlertCircle}
            color="bg-red-500/10 text-red-400"
            subtitle="Requerem atenção"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Meus Projetos */}
          <div className="xl:col-span-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-sky-400" />
                Meus Projetos
              </h2>
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-800">
              {projects.length === 0 ? (
                <div className="py-12 text-center">
                  <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Nenhum projeto ainda</p>
                  <button
                    onClick={() => onNavigate('projects')}
                    className="mt-3 text-xs text-sky-400 hover:text-sky-300 transition"
                  >
                    Criar primeiro projeto →
                  </button>
                </div>
              ) : (
                projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="px-5 py-4 hover:bg-slate-800/50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm truncate">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Users className="w-3 h-3" />
                          {project.members.length}
                        </span>
                        {project._count && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {project._count.tasks}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Criado em {formatDate(project.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tarefas Recentes */}
          <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-800">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" />
                Tarefas Recentes
              </h2>
            </div>
            <div className="divide-y divide-slate-800">
              {recentTasks.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Sem tarefas cadastradas</p>
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-2">
                      <PriorityDot priority={task.priority} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-200 font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <TaskStatusBadge status={task.status} />
                          <span className="text-xs text-slate-500">
                            {formatDate(task.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
