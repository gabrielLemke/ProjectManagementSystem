import { prisma } from '../lib/prisma.js';
import { AppError } from '../errors/app-error.js';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '../schemas/task.schema.js';

const taskInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  _count: { select: { comments: true } },
};

export class TaskService {
  private async membership(projectId: string, userId: string) {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) throw new AppError('Projeto não encontrado ou você não possui acesso.', 404);
    return membership;
  }

  private async requireWriter(projectId: string, userId: string) {
    const membership = await this.membership(projectId, userId);
    if (membership.role === 'VIEWER') throw new AppError('Visualizadores têm acesso somente de leitura.', 403);
    return membership;
  }

  async listTasks(projectId: string, userId: string, query: ListTasksQuery) {
    await this.membership(projectId, userId);
    const { page, limit, status, priority, assigned_to } = query;
    const where = {
      projectId,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assigned_to ? { assignedToId: assigned_to } : {}),
    };
    const [total, data] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: taskInclude,
      }),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createTask(projectId: string, userId: string, input: CreateTaskInput) {
    await this.requireWriter(projectId, userId);
    if (input.assignedToId) {
      const assignee = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: input.assignedToId } },
      });
      if (!assignee) throw new AppError('O responsável deve ser membro deste projeto.', 400);
    }
    return prisma.task.create({
      data: {
        projectId,
        createdById: userId,
        title: input.title,
        description: input.description || null,
        priority: input.priority,
        status: input.status,
        assignedToId: input.assignedToId ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      },
      include: taskInclude,
    });
  }

  async updateTask(projectId: string, taskId: string, userId: string, input: UpdateTaskInput) {
    await this.requireWriter(projectId, userId);
    const task = await prisma.task.findFirst({ where: { id: taskId, projectId }, select: { id: true } });
    if (!task) throw new AppError('Tarefa não encontrada neste projeto.', 404);
    return prisma.task.update({ where: { id: taskId }, data: { status: input.status }, include: taskInclude });
  }

  async listComments(projectId: string, taskId: string, userId: string) {
    await this.membership(projectId, userId);
    const task = await prisma.task.findFirst({ where: { id: taskId, projectId }, select: { id: true } });
    if (!task) throw new AppError('Tarefa não encontrada neste projeto.', 404);
    return prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async createComment(projectId: string, taskId: string, userId: string, content: string) {
    await this.requireWriter(projectId, userId);
    const task = await prisma.task.findFirst({ where: { id: taskId, projectId }, select: { id: true } });
    if (!task) throw new AppError('Tarefa não encontrada neste projeto.', 404);
    return prisma.comment.create({
      data: { taskId, userId, content },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}

export const taskService = new TaskService();
