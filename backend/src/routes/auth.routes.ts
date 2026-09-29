import type { FastifyInstance } from 'fastify';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export async function authRoutes(app: FastifyInstance) {
  // Rota pública: Cadastro de novos usuários
  app.post('/register', (req, rep) => authController.register(req, rep));

  // Rota pública: Login com emissão de token JWT
  app.post('/login', (req, rep) => authController.login(req, rep));

  // Rota protegida: Retorna os dados do usuário autenticado no token
  app.get('/me', { preHandler: [authenticate] }, (req, rep) => authController.me(req, rep));
}
