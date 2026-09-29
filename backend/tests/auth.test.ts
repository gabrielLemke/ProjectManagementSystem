import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import type { FastifyInstance } from 'fastify';

describe('Módulo de Autenticação (Testes de Integração)', () => {
  let app: FastifyInstance;
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let authToken = '';

  before(async () => {
    app = buildApp();
    await app.ready();
  });

  after(async () => {
    // Limpeza dos dados criados durante os testes
    await prisma.user.deleteMany({
      where: { email: { contains: 'test_' } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it('deve registrar um novo usuário com sucesso (POST /api/v1/auth/register)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        name: 'Usuário de Teste',
        email: testEmail,
        password: testPassword,
      },
    });

    assert.strictEqual(response.statusCode, 201);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.user.email, testEmail);
    assert.strictEqual(body.user.name, 'Usuário de Teste');
    assert.ok(body.user.id);
    assert.strictEqual(body.user.passwordHash, undefined, 'A hash da senha não deve ser exposta na resposta');
  });

  it('deve rejeitar registro com e-mail duplicado retornando 409 (POST /api/v1/auth/register)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        name: 'Usuário Duplicado',
        email: testEmail,
        password: testPassword,
      },
    });

    assert.strictEqual(response.statusCode, 409);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.message, 'Este e-mail já está em uso.');
  });

  it('deve rejeitar payload inválido retornando 400 com detalhes do Zod (POST /api/v1/auth/register)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        name: 'U', // muito curto
        email: 'email-invalido',
        password: '123', // muito curta
      },
    });

    assert.strictEqual(response.statusCode, 400);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.error, 'Bad Request');
    assert.ok(body.details.name);
    assert.ok(body.details.email);
    assert.ok(body.details.password);
  });

  it('deve autenticar o usuário com credenciais corretas e retornar o JWT (POST /api/v1/auth/login)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: testEmail,
        password: testPassword,
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.ok(body.token, 'Deve retornar o token JWT');
    assert.strictEqual(body.user.email, testEmail);
    authToken = body.token;
  });

  it('deve rejeitar login com senha incorreta retornando 401 (POST /api/v1/auth/login)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: testEmail,
        password: 'wrong_password',
      },
    });

    assert.strictEqual(response.statusCode, 401);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.message, 'E-mail ou senha inválidos.');
  });

  it('deve rejeitar acesso à rota protegida sem token (GET /api/v1/auth/me)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });

    assert.strictEqual(response.statusCode, 401);
  });

  it('deve retornar os dados do perfil do usuário autenticado (GET /api/v1/auth/me)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.user.email, testEmail);
    assert.ok(body.user.id);
  });
});
