import type { FastifyRequest, FastifyReply } from 'fastify';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import { authService } from '../services/auth.service.js';

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const data = registerSchema.parse(request.body);
    const user = await authService.register(data);

    return reply.status(201).send({
      message: 'Usuário cadastrado com sucesso.',
      user,
    });
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const data = loginSchema.parse(request.body);
    const user = await authService.login(data);

    // Geração do token JWT assinado com tempo de expiração de 7 dias
    const token = await reply.jwtSign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      {
        sign: {
          expiresIn: '7d',
        },
      }
    );

    return reply.send({
      token,
      user,
    });
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    const user = await authService.getUserById(request.user.sub);

    return reply.send({
      user,
    });
  }
}

export const authController = new AuthController();
