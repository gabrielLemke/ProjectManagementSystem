import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Comment, Project, ProjectMember, Task, PaginatedResponse } from '../types'
import {
  Plus,
  Search,
  FolderKanban,
  CheckCircle2,
  MoreHorizontal,
  X,
  Loader2,
  Calendar,
  UserPlus,
  Trash2,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react'
import { formatDate, getInitials, cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { TopBar } from '../components/Layout'

// ─── Modal de Criar Projeto ────────────────────────────────────────────────
function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (p: Project) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { project } = await api.post<{ project: Project }>('/api/v1/projects', {
        name,
        description: description || undefined,
      })
      onCreated(project)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="font-bold text-white text-lg">Novo Projeto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Nome do Projeto <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Site de E-commerce"
              required
              minLength={3}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Descrição <span className="text-slate-500 text-xs">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo do projeto..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition text-sm resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-violet-600 text-white font-semibold text-sm hover:from-sky-400 hover:to-violet-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Card de Projeto ────────────────────────────────────────────────────────
function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-sky-500/40 hover:bg-slate-800/50 transition group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/20 flex items-center justify-center">
          <FolderKanban className="w-5 h-5 text-sky-400" />
        </div>
        <MoreHorizontal className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
      </div>
      <h3 className="font-semibold text-white text-sm mb-1 truncate">{project.name}</h3>
      {project.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-4">{project.description}</p>
      )}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
        <div className="flex -space-x-1.5">
          {project.members.slice(0, 3).map((m) => (
            <div
              key={m.id}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900"
              title={m.user.name}
            >
              {getInitials(m.user.name)}
            </div>
          ))}
          {project.members.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 border-2 border-slate-900">
              +{project.members.length - 3}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {project._count && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {project._count.tasks} tarefas
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Badges de Prioridade ───────────────────────────────────────────
function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const map = {
    LOW: { label: 'Baixa', className: 'text-slate-400 bg-slate-700/50 border-slate-600' },
    MEDIUM: { label: 'Média', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    HIGH: { label: 'Alta', className: 'text-red-400 bg-red-500/10 border-red-500/20' },
  }
  const { label, className } = map[priority]
  return (
    <span className={cn('inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium', className)}>
      {label}
    </span>
  )
}

// ─── Detalhe do Projeto ────────────────────────────────────────────────────
function ProjectDetail({
  project,
  onBack,
  onProjectDeleted,
}: {
  project: Project
  onBack: () => void
  onProjectDeleted: () => void
}) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<ProjectMember[]>(project.members)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [tab, setTab] = useState<'tasks' | 'members'>('tasks')
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'MEMBER' | 'VIEWER'>('MEMBER')
  const [addingMember, setAddingMember] = useState(false)
  const [memberError, setMemberError] = useState('')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM' as Task['priority'], status: 'TODO' as Task['status'], assignedToId: '', dueDate: '' })
  const [taskFilters, setTaskFilters] = useState({ status: '', priority: '', assigned_to: '' })
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)
  const [taskError, setTaskError] = useState('')

  const myRole = members.find((m) => m.user.id === user?.id)?.role
  const isOwner = myRole === 'OWNER'
  const canWrite = myRole === 'OWNER' || myRole === 'MEMBER'

  useEffect(() => {
    const params = new URLSearchParams({ page: '1', limit: '100' })
    if (taskFilters.status) params.set('status', taskFilters.status)
    if (taskFilters.priority) params.set('priority', taskFilters.priority)
    if (taskFilters.assigned_to) params.set('assigned_to', taskFilters.assigned_to)
    setLoadingTasks(true)
    api.get<PaginatedResponse<Task>>(`/api/v1/projects/${project.id}/tasks?${params}`)
      .then((res) => setTasks(res.data))
      .catch(() => {})
      .finally(() => setLoadingTasks(false))
  }, [project.id, taskFilters])

  async function handleMoveTask(task: Task, status: Task['status']) {
    try {
      const { task: updated } = await api.patch<{ task: Task }>(
        `/api/v1/projects/${project.id}/tasks/${task.id}`, { status },
      )
      setTasks((prev) => prev.map((item) => item.id === updated.id ? updated : item))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao mover tarefa')
    }
  }

  async function toggleComments(taskId: string) {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null)
      return
    }
    setExpandedTaskId(taskId)
    setCommentError('')
    try {
      const response = await api.get<{ data: Comment[] }>(`/api/v1/projects/${project.id}/tasks/${taskId}/comments`)
      setComments(response.data)
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Erro ao carregar comentários')
      setComments([])
    }
  }

  async function handleCreateComment(e: React.FormEvent, taskId: string) {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentError('')
    try {
      const { comment } = await api.post<{ comment: Comment }>(
        `/api/v1/projects/${project.id}/tasks/${taskId}/comments`, { content: commentText },
      )
      setComments((prev) => [...prev, comment])
      setCommentText('')
      setTasks((prev) => prev.map((task) => task.id === taskId
        ? { ...task, _count: { comments: (task._count?.comments ?? 0) + 1 } }
        : task))
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Erro ao publicar comentário')
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setAddingMember(true)
    setMemberError('')
    try {
      const { member } = await api.post<{ member: ProjectMember }>(
        `/api/v1/projects/${project.id}/members`,
        { email: newMemberEmail, role: newMemberRole },
      )
      setMembers((prev) => [...prev, member])
      setNewMemberEmail('')
      setShowAddMember(false)
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : 'Erro ao adicionar membro')
    } finally {
      setAddingMember(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Remover este membro do projeto?')) return
    try {
      await api.delete(`/api/v1/projects/${project.id}/members/${memberId}`)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover membro')
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    setCreatingTask(true)
    setTaskError('')
    try {
      const { task } = await api.post<{ task: Task }>(
        `/api/v1/projects/${project.id}/tasks`,
        { ...newTask, assignedToId: newTask.assignedToId || null, dueDate: newTask.dueDate ? new Date(`${newTask.dueDate}T23:59:59.000Z`).toISOString() : null },
      )
      setTasks((prev) => [task, ...prev])
      setNewTask({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', assignedToId: '', dueDate: '' })
      setShowCreateTask(false)
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : 'Erro ao criar tarefa')
    } finally {
      setCreatingTask(false)
    }
  }

  async function handleDeleteProject() {
    if (!confirm(`Excluir o projeto "${project.name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await api.delete(`/api/v1/projects/${project.id}`)
      onProjectDeleted()
      onBack()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir projeto')
    }
  }

  const tasksByStatus = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar title={project.name} subtitle={project.description ?? 'Detalhes do projeto'} />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Projetos
          </button>
          {isOwner && (
            <button
              onClick={handleDeleteProject}
              className="ml-auto flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-400/40 px-3 py-1.5 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir Projeto
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit mb-6">
          {(['tasks', 'members'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition',
                tab === t ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200',
              )}
            >
              {t === 'tasks' ? `Tarefas (${tasks.length})` : `Membros (${members.length})`}
            </button>
          ))}
        </div>

        {/* TAREFAS */}
        {tab === 'tasks' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Board de Tarefas</h3>
              {canWrite && (
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  Nova Tarefa
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mb-5">
              <select aria-label="Filtrar por status" value={taskFilters.status} onChange={(e) => setTaskFilters((f) => ({ ...f, status: e.target.value }))} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-sm">
                <option value="">Todos os status</option><option value="TODO">A Fazer</option><option value="IN_PROGRESS">Em andamento</option><option value="DONE">Concluído</option>
              </select>
              <select aria-label="Filtrar por prioridade" value={taskFilters.priority} onChange={(e) => setTaskFilters((f) => ({ ...f, priority: e.target.value }))} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-sm">
                <option value="">Todas as prioridades</option><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option>
              </select>
              <select aria-label="Filtrar por responsável" value={taskFilters.assigned_to} onChange={(e) => setTaskFilters((f) => ({ ...f, assigned_to: e.target.value }))} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-sm">
                <option value="">Todos os responsáveis</option>{members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}
              </select>
            </div>

            {/* Modal Criar Tarefa */}
            {showCreateTask && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
                  <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="font-bold text-white text-lg">Nova Tarefa</h2>
                    <button onClick={() => setShowCreateTask(false)} className="text-slate-400 hover:text-slate-200">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                    {taskError && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{taskError}</div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Título *</label>
                      <input
                        value={newTask.title}
                        onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Ex: Criar tela de login"
                        required
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição</label>
                      <textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Descreva a tarefa..."
                        rows={3}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition text-sm resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Prioridade</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value as Task['priority'] }))}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 text-sm"
                      >
                        <option value="LOW">Baixa</option>
                        <option value="MEDIUM">Média</option>
                        <option value="HIGH">Alta</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                        <select value={newTask.status} onChange={(e) => setNewTask((p) => ({ ...p, status: e.target.value as Task['status'] }))} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
                          <option value="TODO">A Fazer</option><option value="IN_PROGRESS">Em andamento</option><option value="DONE">Concluído</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Responsável</label>
                        <select value={newTask.assignedToId} onChange={(e) => setNewTask((p) => ({ ...p, assignedToId: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
                          <option value="">Sem responsável</option>{members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Prazo</label>
                        <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowCreateTask(false)} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm font-medium">Cancelar</button>
                      <button type="submit" disabled={creatingTask} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-violet-600 text-white font-semibold text-sm hover:from-sky-400 hover:to-violet-500 transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {creatingTask && <Loader2 className="w-4 h-4 animate-spin" />}
                        Criar Tarefa
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loadingTasks ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {(Object.entries(tasksByStatus) as [Task['status'], Task[]][]).map(([status, cols]) => {
                  const colConfig = {
                    TODO: { label: 'A Fazer', color: 'border-slate-600', dot: 'bg-slate-400' },
                    IN_PROGRESS: { label: 'Em Andamento', color: 'border-sky-500/40', dot: 'bg-sky-400' },
                    DONE: { label: 'Concluído', color: 'border-emerald-500/40', dot: 'bg-emerald-400' },
                  }
                  const config = colConfig[status]
                  return (
                    <div key={status} className={cn('bg-slate-900 border rounded-xl overflow-hidden', config.color)}>
                      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', config.dot)} />
                        <span className="text-sm font-semibold text-slate-200">{config.label}</span>
                        <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                          {cols.length}
                        </span>
                      </div>
                      <div className="p-3 space-y-2 min-h-[120px]">
                        {cols.length === 0 && (
                          <p className="text-xs text-slate-500 text-center py-6">Sem tarefas aqui</p>
                        )}
                        {cols.map((task) => (
                          <div key={task.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition">
                            <button onClick={() => toggleComments(task.id)} className="text-left text-sm font-medium text-white mb-2 hover:text-sky-300">{task.title}</button>
                            <div className="flex items-center gap-2 flex-wrap">
                              <PriorityBadge priority={task.priority} />
                              {task.dueDate && (
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                            {task.assignedTo && (
                              <div className="mt-2 flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
                                  {getInitials(task.assignedTo.name)}
                                </div>
                                <span className="text-xs text-slate-400">{task.assignedTo.name}</span>
                              </div>
                            )}
                            <div className="mt-3 flex items-center justify-between">
                              <button onClick={() => toggleComments(task.id)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-300"><MessageSquare className="w-3 h-3" />{task._count?.comments ?? 0} comentários</button>
                              {canWrite && <select aria-label={`Mover ${task.title}`} value={task.status} onChange={(e) => handleMoveTask(task, e.target.value as Task['status'])} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300">
                                <option value="TODO">A Fazer</option><option value="IN_PROGRESS">Em andamento</option><option value="DONE">Concluído</option>
                              </select>}
                            </div>
                            {expandedTaskId === task.id && (
                              <div className="mt-3 pt-3 border-t border-slate-700 space-y-3">
                                {commentError && <p className="text-xs text-red-400">{commentError}</p>}
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {comments.map((comment) => <div key={comment.id} className="text-xs"><span className="text-sky-300 font-medium">{comment.user.name}</span><span className="text-slate-500"> · {formatDate(comment.createdAt)}</span><p className="text-slate-300 mt-0.5 whitespace-pre-wrap">{comment.content}</p></div>)}
                                  {comments.length === 0 && !commentError && <p className="text-xs text-slate-500">Nenhum comentário ainda.</p>}
                                </div>
                                {canWrite && <form onSubmit={(e) => handleCreateComment(e, task.id)} className="flex gap-2">
                                  <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Escreva um comentário..." className="min-w-0 flex-1 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500" />
                                  <button type="submit" disabled={!commentText.trim()} className="px-2 py-1.5 rounded bg-sky-600 text-white text-xs disabled:opacity-50">Enviar</button>
                                </form>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* MEMBROS */}
        {tab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Equipe do Projeto</h3>
              {isOwner && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-medium transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Adicionar Membro
                </button>
              )}
            </div>

            {showAddMember && (
              <form onSubmit={handleAddMember} className="mb-5 bg-slate-900 border border-slate-800 rounded-xl p-5">
                {memberError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{memberError}</div>
                )}
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as 'MEMBER' | 'VIEWER')}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="MEMBER">Membro</option>
                    <option value="VIEWER">Visualizador</option>
                  </select>
                  <button type="submit" disabled={addingMember} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2">
                    {addingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Adicionar
                  </button>
                  <button type="button" onClick={() => { setShowAddMember(false); setMemberError('') }} className="p-2 text-slate-400 hover:text-slate-200 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {members.map((member, idx) => (
                <div key={member.id} className={cn('flex items-center gap-4 px-5 py-4', idx !== 0 && 'border-t border-slate-800')}>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {getInitials(member.user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{member.user.name}</p>
                    <p className="text-xs text-slate-400">{member.user.email}</p>
                  </div>
                  <span className={cn(
                    'text-xs px-2.5 py-1 rounded-full font-semibold border',
                    member.role === 'OWNER' && 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    member.role === 'MEMBER' && 'text-sky-400 bg-sky-500/10 border-sky-500/20',
                    member.role === 'VIEWER' && 'text-slate-400 bg-slate-700/50 border-slate-600',
                  )}>
                    {member.role === 'OWNER' ? 'Proprietário' : member.role === 'MEMBER' ? 'Membro' : 'Visualizador'}
                  </span>
                  {isOwner && member.user.id !== user?.id && (
                    <button onClick={() => handleRemoveMember(member.id)} className="text-slate-500 hover:text-red-400 transition p-1 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Página de Projetos ────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    api.get<PaginatedResponse<Project>>('/api/v1/projects?page=1&limit=50')
      .then((res) => setProjects(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onProjectDeleted={() => {
          setProjects((prev) => prev.filter((p) => p.id !== selectedProject.id))
          setSelectedProject(null)
        }}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar title="Projetos" subtitle="Gerencie seus projetos e equipes" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar projetos..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-violet-600 text-white rounded-lg text-sm font-semibold hover:from-sky-400 hover:to-violet-500 transition"
          >
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-white font-semibold mb-2">
              {search ? 'Nenhum projeto encontrado' : 'Sem projetos ainda'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {search ? 'Tente buscar outro termo.' : 'Crie seu primeiro projeto para começar.'}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Criar Projeto
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
            ))}
          </div>
        )}

        {showCreate && (
          <CreateProjectModal
            onClose={() => setShowCreate(false)}
            onCreated={(p) => setProjects((prev) => [p, ...prev])}
          />
        )}
      </main>
    </div>
  )
}
