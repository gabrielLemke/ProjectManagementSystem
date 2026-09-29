# 🚀 Project Management System (PMS)

Uma plataforma completa de gerenciamento de projetos desenvolvida com arquitetura moderna, tipagem estrita de ponta a ponta e foco em boas práticas de engenharia de software para ambiente de produção.

---

## 🛠️ Stack Tecnológica

- **Backend**: Node.js, Fastify, TypeScript, Zod, Prisma ORM
- **Banco de Dados**: PostgreSQL (executado via Docker ou serviço local)
- **Frontend**: React, TypeScript, Tailwind CSS / shadcn/ui, Vite *(Fase 4)*
- **Infraestrutura & DevOps**: Docker, Docker Compose, GitHub Actions (CI/CD), Cloudflare

---

## 📂 Estrutura do Repositório (Monorepo)

```text
ProjectManagementSystem/
├── .github/              # Pipelines de CI/CD (GitHub Actions)
├── backend/              # API REST em Fastify + TypeScript + Prisma
│   ├── prisma/           # Schema e migrations do banco de dados
│   ├── src/              # Código-fonte da API
│   └── tests/            # Testes automatizados (Unitários e E2E)
├── frontend/             # Aplicação SPA em React + TypeScript
├── docker-compose.yml    # Orquestração de containers para desenvolvimento
└── .env.example          # Modelo de variáveis de ambiente
```

---

## ⚙️ Pré-requisitos

- [Node.js](https://nodejs.org/) v20+ ou superior (Recomendado v22+)
- [Git](https://git-scm.com/)
- [Docker & Docker Compose](https://www.docker.com/) (ou PostgreSQL instalado localmente)

---

## 🚀 Como Executar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/gabrielLemke/ProjectManagementSystem.git
cd ProjectManagementSystem
```

### 2. Configurar variáveis de ambiente
Copie o arquivo de exemplo para `.env`:
```bash
cp .env.example .env
```

### 3. Iniciar o Banco de Dados (PostgreSQL via Docker)
```bash
docker compose up -d
```
*(Caso utilize um serviço PostgreSQL instalado diretamente no seu sistema operacional, certifique-se de atualizar a `DATABASE_URL` no `.env` com suas credenciais).*

### 4. Executar o Backend
```bash
cd backend
npm install
npm run dev
```
A API estará acessível em: `http://localhost:3333`

---

## 🗺️ Roadmap de Desenvolvimento

- [x] **Fase 1**: Arquitetura, setup do monorepo, Docker Compose e repositório Git.
- [ ] **Fase 2**: Backend Core (Prisma ORM, migrations, autenticação JWT, validação com Zod e tratamento de erros).
- [ ] **Fase 3**: Regras de negócio (Projetos, Membros/RBAC, Tarefas, Comentários, Paginação e Filtros).
- [ ] **Fase 4**: Frontend (React + TypeScript + Vite, telas de Auth, Dashboard e Kanban).
- [ ] **Fase 5**: CI/CD (GitHub Actions), Dockerfile multi-stage, deploy em produção com HTTPS/Cloudflare.
