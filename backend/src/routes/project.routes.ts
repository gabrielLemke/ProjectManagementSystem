import type { FastifyInstance } from 'fastify';
import { projectController } from '../controllers/project.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { taskController } from '../controllers/task.controller.js';

export async function projectRoutes(app: FastifyInstance) {
  // Todas as rotas de projetos exigem usuário autenticado
  app.addHook('preHandler', authenticate);

  app.post('/', (req, rep) => projectController.create(req, rep));
  app.get('/', (req, rep) => projectController.list(req, rep));
  app.get('/:id', (req, rep) => projectController.getById(req, rep));
  app.patch('/:id', (req, rep) => projectController.update(req, rep));
  app.delete('/:id', (req, rep) => projectController.delete(req, rep));

  // Gerenciamento de Membros (RBAC)
  app.post('/:id/members', (req, rep) => projectController.addMember(req, rep));
  app.delete('/:id/members/:memberId', (req, rep) => projectController.removeMember(req, rep));

  // Tarefas e comentários do projeto
  app.get('/:id/tasks', (req, rep) => taskController.list(req, rep));
  app.post('/:id/tasks', (req, rep) => taskController.create(req, rep));
  app.patch('/:id/tasks/:taskId', (req, rep) => taskController.update(req, rep));
  app.get('/:id/tasks/:taskId/comments', (req, rep) => taskController.listComments(req, rep));
  app.post('/:id/tasks/:taskId/comments', (req, rep) => taskController.createComment(req, rep));
}
