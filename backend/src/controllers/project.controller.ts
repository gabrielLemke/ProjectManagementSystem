import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  projectParamsSchema,
  projectMemberParamsSchema,
  listProjectsQuerySchema,
} from '../schemas/project.schema.js';
import { projectService } from '../services/project.service.js';

export class ProjectController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createProjectSchema.parse(request.body);
    const project = await projectService.createProject(request.user.sub, data);

    return reply.status(201).send({
      message: 'Projeto criado com sucesso.',
      project,
    });
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = listProjectsQuerySchema.parse(request.query);
    const result = await projectService.listProjects(request.user.sub, query);

    return reply.send(result);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = projectParamsSchema.parse(request.params);
    const project = await projectService.getProjectById(id, request.user.sub);

    return reply.send({ project });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = projectParamsSchema.parse(request.params);
    const data = updateProjectSchema.parse(request.body);
    const project = await projectService.updateProject(id, request.user.sub, data);

    return reply.send({
      message: 'Projeto atualizado com sucesso.',
      project,
    });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = projectParamsSchema.parse(request.params);
    const result = await projectService.deleteProject(id, request.user.sub);

    return reply.send(result);
  }

  async addMember(request: FastifyRequest, reply: FastifyReply) {
    const { id } = projectParamsSchema.parse(request.params);
    const data = addMemberSchema.parse(request.body);
    const member = await projectService.addMember(id, request.user.sub, data);

    return reply.status(201).send({
      message: 'Membro adicionado ao projeto com sucesso.',
      member,
    });
  }

  async removeMember(request: FastifyRequest, reply: FastifyReply) {
    const { id, memberId } = projectMemberParamsSchema.parse(request.params);
    const result = await projectService.removeMember(id, request.user.sub, memberId);

    return reply.send(result);
  }
}

export const projectController = new ProjectController();
