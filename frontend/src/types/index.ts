export type Role = 'OWNER' | 'MEMBER' | 'VIEWER'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt?: string
}

export interface ProjectMember {
  id: string
  role: Role
  joinedAt: string
  user: Pick<User, 'id' | 'name' | 'email'>
}

export interface Project {
  id: string
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
  members: ProjectMember[]
  _count?: {
    tasks: number
    members: number
  }
}

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string | null
  createdAt: string
  updatedAt: string
  createdBy: Pick<User, 'id' | 'name' | 'email'>
  assignedTo?: Pick<User, 'id' | 'name' | 'email'> | null
  _count?: { comments: number }
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: Pick<User, 'id' | 'name' | 'email'>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}
