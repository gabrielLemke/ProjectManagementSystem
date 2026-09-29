import { prisma } from '../lib/prisma.js';
import { AppError } from '../errors/app-error.js';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  AddMemberInput,
  ListProjectsQuery,
} from '../schemas/project.schema.js';

export class ProjectService {
  async createProject(userId: string, data: CreateProjectInput) {
    // Transação interativa para garantir atomicidade: o projeto e o vínculo de OWNER são criados juntos
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: data.name,
          description: data.description,
          members: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return project;
    });
  }

  async listProjects(userId: string, query: ListProjectsQuery) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      members: {
        some: {
          userId,
        },
      },
      ...(search
        ? {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getProjectById(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Projeto não encontrado.', 404);
    }

    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new AppError('Você não tem permissão para acessar este projeto.', 403);
    }

    return project;
  }

  async updateProject(projectId: string, userId: string, data: UpdateProjectInput) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new AppError('Projeto não encontrado ou você não possui acesso.', 404);
    }

    if (membership.role !== 'OWNER') {
      throw new AppError('Apenas o proprietário (OWNER) pode editar os dados do projeto.', 403);
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description,
      },
    });

    return updatedProject;
  }

  async deleteProject(projectId: string, userId: string) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new AppError('Projeto não encontrado ou você não possui acesso.', 404);
    }

    if (membership.role !== 'OWNER') {
      throw new AppError('Apenas o proprietário (OWNER) pode excluir o projeto.', 403);
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { message: 'Projeto excluído com sucesso.' };
  }

  async addMember(projectId: string, requesterId: string, data: AddMemberInput) {
    const requesterMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: requesterId,
        },
      },
    });

    if (!requesterMembership || requesterMembership.role !== 'OWNER') {
      throw new AppError('Apenas o proprietário (OWNER) pode adicionar novos membros.', 403);
    }

    const userToAdd = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!userToAdd) {
      throw new AppError('Usuário com este e-mail não foi encontrado no sistema.', 404);
    }

    const alreadyMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: userToAdd.id,
        },
      },
    });

    if (alreadyMember) {
      throw new AppError('Este usuário já é membro deste projeto.', 409);
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId: userToAdd.id,
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return newMember;
  }

  async removeMember(projectId: string, requesterId: string, memberId: string) {
    const requesterMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: requesterId,
        },
      },
    });

    if (!requesterMembership || requesterMembership.role !== 'OWNER') {
      throw new AppError('Apenas o proprietário (OWNER) pode remover membros.', 403);
    }

    const targetMember = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.projectId !== projectId) {
      throw new AppError('Membro não encontrado neste projeto.', 404);
    }

    if (targetMember.userId === requesterId) {
      throw new AppError('O proprietário do projeto não pode remover a si mesmo.', 400);
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    return { message: 'Membro removido com sucesso.' };
  }
}

export const projectService = new ProjectService();
