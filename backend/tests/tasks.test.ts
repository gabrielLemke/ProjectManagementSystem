import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import type { FastifyInstance } from 'fastify';

describe('Módulo de Tarefas e Comentários (Testes de Integração & Kanban)', () => {
  let app: FastifyInstance;
  let ownerToken = '';
  let viewerToken = '';
  let projectId = '';
  let taskId = '';

  const ownerEmail = `task_owner_${Date.now()}@example.com`;
  const viewerEmail = `task_viewer_${Date.now()}@example.com`;

  before(async () => {
    app = buildApp();
    await app.ready();

    // 1. Cadastra e autentica OWNER
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Owner Task', email: ownerEmail, password: 'Password123!' },
    });
    const ownerLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: ownerEmail, password: 'Password123!' },
    });
    ownerToken = JSON.parse(ownerLogin.payload).token;

    // 2. Cadastra e autentica VIEWER
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Viewer Task', email: viewerEmail, password: 'Password123!' },
    });
    const viewerLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: viewerEmail, password: 'Password123!' },
    });
    viewerToken = JSON.parse(viewerLogin.payload).token;

    // 3. Cria projeto pelo OWNER
    const projRes = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { name: 'Projeto Kanban Teste' },
    });
    projectId = JSON.parse(projRes.payload).project.id;

    // 4. Adiciona VIEWER ao projeto
    await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/members`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { email: viewerEmail, role: 'VIEWER' },
    });
  });

  after(async () => {
    if (projectId) {
      await prisma.project.deleteMany({
        where: { id: projectId },
      });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, viewerEmail] } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it('deve permitir que o OWNER crie uma nova tarefa (POST /api/v1/projects/:id/tasks)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/tasks`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        title: 'Criar componente de Kanban',
        description: 'Construir as 3 colunas de drag and drop',
        priority: 'HIGH',
      },
    });

    assert.strictEqual(response.statusCode, 201);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.task.title, 'Criar componente de Kanban');
    assert.strictEqual(body.task.status, 'TODO');
    assert.strictEqual(body.task.priority, 'HIGH');
    assert.strictEqual(body.task.createdBy.email, ownerEmail);

    taskId = body.task.id;
  });

  it('deve impedir que um VIEWER crie tarefas retornando 403 (POST /api/v1/projects/:id/tasks)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/tasks`,
      headers: { authorization: `Bearer ${viewerToken}` },
      payload: {
        title: 'Tentativa de criar tarefa como viewer',
      },
    });

    assert.strictEqual(response.statusCode, 403);
  });

  it('deve permitir listar tarefas do projeto com filtros (GET /api/v1/projects/:id/tasks)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/tasks?status=TODO&priority=HIGH`,
      headers: { authorization: `Bearer ${viewerToken}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].id, taskId);
  });

  it('deve permitir que o OWNER atualize o status da tarefa (PATCH /api/v1/projects/:id/tasks/:taskId)', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/projects/${projectId}/tasks/${taskId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        status: 'IN_PROGRESS',
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.task.status, 'IN_PROGRESS');
  });

  it('deve permitir adicionar comentário em uma tarefa (POST /api/v1/projects/:id/tasks/:taskId/comments)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        content: 'Trabalho iniciado nas colunas do Kanban.',
      },
    });

    assert.strictEqual(response.statusCode, 201);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.comment.content, 'Trabalho iniciado nas colunas do Kanban.');
    assert.strictEqual(body.comment.user.email, ownerEmail);
  });

  it('deve listar os comentários de uma tarefa (GET /api/v1/projects/:id/tasks/:taskId/comments)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
      headers: { authorization: `Bearer ${viewerToken}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].content, 'Trabalho iniciado nas colunas do Kanban.');
  });
});
