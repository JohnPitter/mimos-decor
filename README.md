# Mimos Decor

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss)

**Sistema de Gestao para Loja de Decoracao**

*Controle de produtos, vendas, usuarios e dashboard analitico*

[Instalacao](#instalacao) •
[Features](#features) •
[Arquitetura](#arquitetura) •
[Configuracao](#configuracao)

</div>

---

## Overview

Mimos Decor e um sistema completo de gestao para lojas de decoracao, com controle de produtos, vendas, usuarios, logs de auditoria e dashboard analitico. Construido como um pnpm monorepo com Turborepo.

**O que inclui:**
- **Dashboard** - Metricas de vendas, produtos e performance
- **Produtos** - Cadastro, estoque, precos e categorias
- **Vendas** - Registro e historico de vendas
- **Usuarios** - Gestao de usuarios com autenticacao JWT
- **Auditoria** - Logs de todas as acoes do sistema
- **Pricing Engine** - Motor de precificacao compartilhado

---

## Arquitetura

```
mimos-decor/
├── packages/
│   ├── api/          # Express 5 REST API + Prisma ORM
│   ├── web/          # React 19 SPA + Vite + Tailwind 4
│   └── shared/       # Types, constants, pricing engine
├── turbo.json        # Turborepo pipeline config
└── pnpm-workspace.yaml
```

| Package | Stack | Descricao |
|---------|-------|-----------|
| `@mimos/api` | Express 5, Prisma 6, JWT | REST API com PostgreSQL |
| `@mimos/web` | React 19, Vite 6, Tailwind 4, Zustand 5, Recharts | SPA com dashboard e CRUD |
| `@mimos/shared` | TypeScript | Types, constantes e pricing engine compartilhados |

---

## Features

| Feature | Descricao |
|---------|-----------|
| **Dashboard** | Graficos de vendas, metricas e KPIs |
| **Produtos** | CRUD completo com categorias e estoque |
| **Vendas** | Registro, historico e relatorios |
| **Usuarios** | Autenticacao JWT, roles e permissoes |
| **Audit Logs** | Rastreamento de todas as acoes |
| **Pricing Engine** | Motor de precificacao no shared package |
| **Responsivo** | Interface mobile-first com Tailwind |

---

## Instalacao

### Requisitos

| Requisito | Versao |
|-----------|--------|
| Node.js | 20+ |
| pnpm | 10+ |
| PostgreSQL | 14+ |

### Setup

```bash
# Clonar o repositorio
git clone https://github.com/JohnPitter/mimos-decor.git
cd mimos-decor

# Instalar dependencias
pnpm install

# Configurar variaveis de ambiente
cp packages/api/.env.example packages/api/.env
# Editar DATABASE_URL e JWT_SECRET

# Rodar migrations
cd packages/api && npx prisma migrate dev

# Iniciar em desenvolvimento
pnpm dev
```

### Endpoints

| Servico | URL |
|---------|-----|
| Web (frontend) | `http://localhost:5173` |
| API (backend) | `http://localhost:3001` |

---

## Configuracao

### Variaveis de Ambiente (API)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mimos_decor
JWT_SECRET=your-secret-key
PORT=3001
```

### Scripts

```bash
pnpm dev        # Inicia todos os packages em modo dev
pnpm build      # Build de producao (via Turborepo)
pnpm test       # Roda testes de todos os packages
pnpm lint       # Lint de todos os packages
```

---

## API Routes

| Metodo | Rota | Descricao |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/register` | Registro |
| `GET` | `/api/products` | Listar produtos |
| `POST` | `/api/products` | Criar produto |
| `GET` | `/api/sales` | Listar vendas |
| `POST` | `/api/sales` | Registrar venda |
| `GET` | `/api/dashboard` | Metricas do dashboard |
| `GET` | `/api/users` | Listar usuarios |
| `GET` | `/api/audit-logs` | Logs de auditoria |
| `GET` | `/health` | Health check |

---

## Deploy

O projeto esta configurado para deploy via [LuxView Cloud](https://github.com/JohnPitter/luxview-cloud), com Dockerfile automatico gerado por AI agent.

---

## License

MIT License - see [LICENSE](LICENSE) file.
