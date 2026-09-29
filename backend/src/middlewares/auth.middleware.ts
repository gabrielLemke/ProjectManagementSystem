import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors/app-error.js';

// Declaração de tipagem estrita para o FastifyJWT
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      name: string;
    };
    user: {
      sub: string;
      email: string;
      name: string;
    };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    throw new AppError('Token de autenticação ausente ou inválido.', 401);
  }
}
