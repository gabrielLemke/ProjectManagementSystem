import fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { ZodError } from 'zod';
import { AppError } from './errors/app-error.js';
import { authRoutes } from './routes/auth.routes.js';

export function buildApp() {
  const app = fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Configuração de CORS para permitir requisições do frontend
  app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Registro do plugin de JWT
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'fallback_super_secret_jwt_key_at_least_32_chars',
  });

  // Rota de Health Check
  app.get('/health', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  });

  // Registro das rotas com versionamento de API
  app.register(authRoutes, { prefix: '/api/v1/auth' });

  // Tratamento global e padronizado de erros
  app.setErrorHandler((error: FastifyError, request, reply) => {
    // Erros de validação do Zod
    if (error instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Falha na validação dos dados enviados.',
        details: error.flatten().fieldErrors,
      });
    }

    // Erros de domínio/negócio da aplicação (AppError)
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.statusCode >= 500 ? 'InternalServerError' : 'ClientError',
        message: error.message,
      });
    }

    // Log detalhado de erros não tratados
    app.log.error(error);

    const statusCode = error.statusCode ?? 500;
    const message = statusCode >= 500 ? 'Ocorreu um erro interno no servidor.' : error.message;

    return reply.status(statusCode).send({
      statusCode,
      error: error.name || 'InternalServerError',
      message,
    });
  });

  return app;
}
