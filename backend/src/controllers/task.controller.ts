import type { FastifyRequest, FastifyReply } from 'fastify';
import { createCommentSchema, createTaskSchema, listTasksQuerySchema, taskParamsSchema, updateTaskSchema } from '../schemas/task.schema.js';
import { taskService } from '../services/task.service.js';

export class TaskController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { id } = taskParamsSchema.pick({ id: true }).parse(request.params);
    const query = listTasksQuerySchema.parse(request.query);
    return reply.send(await taskService.listTasks(id, request.user.sub, query));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const { id } = taskParamsSchema.pick({ id: true }).parse(request.params);
    const data = createTaskSchema.parse(request.body);
    const task = await taskService.createTask(id, request.user.sub, data);
    return reply.status(201).send({ message: 'Tarefa criada com sucesso.', task });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id, taskId } = taskParamsSchema.parse(request.params);
    const data = updateTaskSchema.parse(request.body);
    const task = await taskService.updateTask(id, taskId, request.user.sub, data);
    return reply.send({ message: 'Tarefa atualizada com sucesso.', task });
  }

  async listComments(request: FastifyRequest, reply: FastifyReply) {
    const { id, taskId } = taskParamsSchema.parse(request.params);
    return reply.send({ data: await taskService.listComments(id, taskId, request.user.sub) });
  }

  async createComment(request: FastifyRequest, reply: FastifyReply) {
    const { id, taskId } = taskParamsSchema.parse(request.params);
    const { content } = createCommentSchema.parse(request.body);
    const comment = await taskService.createComment(id, taskId, request.user.sub, content);
    return reply.status(201).send({ message: 'Comentário publicado com sucesso.', comment });
  }
}

export const taskController = new TaskController();
