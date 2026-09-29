import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import type { FastifyInstance } from 'fastify';

describe('Módulo de Projetos e Membros (Testes de Integração & RBAC)', () => {
  let app: FastifyInstance;
  let ownerToken = '';
  let memberToken = '';
  let otherUserToken = '';
  let createdProjectId = '';
  let addedMemberId = '';

  const ownerEmail = `owner_${Date.now()}@example.com`;
  const memberEmail = `member_${Date.now()}@example.com`;
  const otherEmail = `other_${Date.now()}@example.com`;

  before(async () => {
    app = buildApp();
    await app.ready();

    // 1. Cadastra e autentica o usuário Dono (Owner)
    const ownerReg = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Owner User', email: ownerEmail, password: 'Password123!' },
    });
    assert.strictEqual(ownerReg.statusCode, 201);

    const ownerLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: ownerEmail, password: 'Password123!' },
    });
    ownerToken = JSON.parse(ownerLogin.payload).token;

    // 2. Cadastra e autentica o usuário Membro
    const memberReg = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Member User', email: memberEmail, password: 'Password123!' },
    });
    assert.strictEqual(memberReg.statusCode, 201);

    const memberLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: memberEmail, password: 'Password123!' },
    });
    memberToken = JSON.parse(memberLogin.payload).token;

    // 3. Cadastra e autentica um terceiro usuário (sem relação com o projeto)
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Other User', email: otherEmail, password: 'Password123!' },
    });
    const otherLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: otherEmail, password: 'Password123!' },
    });
    otherUserToken = JSON.parse(otherLogin.payload).token;
  });

  after(async () => {
    // Limpeza de todos os dados criados nos testes
    await prisma.user.deleteMany({
      where: {
        email: { in: [ownerEmail, memberEmail, otherEmail] },
      },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it('deve criar um projeto com sucesso e atribuir o criador como OWNER (POST /api/v1/projects)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        name: 'Projeto Piloto Alfa',
        description: 'Primeiro projeto para testes de fluxo',
      },
    });

    assert.strictEqual(response.statusCode, 201);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.project.name, 'Projeto Piloto Alfa');
    assert.strictEqual(body.project.members.length, 1);
    assert.strictEqual(body.project.members[0].role, 'OWNER');
    assert.strictEqual(body.project.members[0].user.email, ownerEmail);

    createdProjectId = body.project.id;
  });

  it('deve listar os projetos do usuário com paginação (GET /api/v1/projects)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?page=1&limit=10',
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.ok(Array.isArray(body.data));
    assert.strictEqual(body.pagination.total, 1);
    assert.strictEqual(body.data[0].id, createdProjectId);
  });

  it('deve obter os detalhes do projeto se o usuário for membro (GET /api/v1/projects/:id)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${createdProjectId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.project.id, createdProjectId);
    assert.strictEqual(body.project.name, 'Projeto Piloto Alfa');
  });

  it('deve negar acesso ao projeto para um usuário não membro retornando 403 (GET /api/v1/projects/:id)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${createdProjectId}`,
      headers: { authorization: `Bearer ${otherUserToken}` },
    });

    assert.strictEqual(response.statusCode, 403);
  });

  it('deve permitir que o OWNER adicione um novo membro ao projeto (POST /api/v1/projects/:id/members)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${createdProjectId}/members`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        email: memberEmail,
        role: 'MEMBER',
      },
    });

    assert.strictEqual(response.statusCode, 201);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.member.user.email, memberEmail);
    assert.strictEqual(body.member.role, 'MEMBER');

    addedMemberId = body.member.id;
  });

  it('deve rejeitar adicionar o mesmo membro duas vezes retornando 409 (POST /api/v1/projects/:id/members)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${createdProjectId}/members`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        email: memberEmail,
        role: 'MEMBER',
      },
    });

    assert.strictEqual(response.statusCode, 409);
  });

  it('deve impedir que um MEMBER tente adicionar novos membros retornando 403 (POST /api/v1/projects/:id/members)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${createdProjectId}/members`,
      headers: { authorization: `Bearer ${memberToken}` },
      payload: {
        email: otherEmail,
        role: 'MEMBER',
      },
    });

    assert.strictEqual(response.statusCode, 403);
  });

  it('deve permitir que o OWNER atualize os dados do projeto (PATCH /api/v1/projects/:id)', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/projects/${createdProjectId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        name: 'Projeto Alfa - Renomeado',
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.project.name, 'Projeto Alfa - Renomeado');
  });

  it('deve impedir que um MEMBER atualize os dados do projeto retornando 403 (PATCH /api/v1/projects/:id)', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/projects/${createdProjectId}`,
      headers: { authorization: `Bearer ${memberToken}` },
      payload: {
        name: 'Tentativa de Hack por Membro',
      },
    });

    assert.strictEqual(response.statusCode, 403);
  });

  it('deve impedir que o OWNER remova a si próprio do projeto (DELETE /api/v1/projects/:id/members/:memberId)', async () => {
    // Obtém o ID do membro que é o OWNER
    const projectRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${createdProjectId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    const project = JSON.parse(projectRes.payload).project;
    const ownerMember = project.members.find((m: any) => m.role === 'OWNER');

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${createdProjectId}/members/${ownerMember.id}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    assert.strictEqual(response.statusCode, 400);
  });

  it('deve permitir que o OWNER remova um membro (DELETE /api/v1/projects/:id/members/:memberId)', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${createdProjectId}/members/${addedMemberId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    assert.strictEqual(response.statusCode, 200);
  });

  it('deve permitir que o OWNER exclua o projeto (DELETE /api/v1/projects/:id)', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${createdProjectId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    assert.strictEqual(response.statusCode, 200);

    // Confirma que o projeto não existe mais
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${createdProjectId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    assert.strictEqual(getRes.statusCode, 404);
  });
});
