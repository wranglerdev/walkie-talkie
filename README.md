# walkie-talkie

Capture lembretes por voz. A IA transcreve, classifica e organiza automaticamente.

## Estrutura

```
api/        Hono + Cloudflare Workers + D1 + R2 + BetterAuth
frontend/   Vite + React + Tailwind v4 + daisyUI v5 (PWA)
```

## Setup

### 1. Dependências

```bash
npm install
```

### 2. Variáveis de ambiente (API)

Crie `api/.dev.vars` para desenvolvimento local:

```
BETTER_AUTH_SECRET=seu-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:5173
ADMIN_SECRET=seu-admin-secret
OPENROUTER_API_KEY=sua-chave-openrouter
```

Em produção, configure via `wrangler secret put`:

```bash
cd api
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put ADMIN_SECRET
npx wrangler secret put OPENROUTER_API_KEY
```

### 3. Desenvolvimento local

```bash
# Terminal 1: API
cd api && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 4. Migrations BetterAuth (primeira vez)

Com a API rodando localmente:

```bash
curl -X POST http://localhost:8787/api/admin/migrate \
  -H "x-admin-secret: seu-admin-secret"
```

### 5. Seed do usuário único

```bash
curl -X POST http://localhost:8787/api/admin/seed \
  -H "x-admin-secret: seu-admin-secret" \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"suasenha","name":"Seu Nome"}'
```

### 6. Deploy

```bash
# API
cd api && npm run deploy

# Repita os passos 4 e 5 apontando para a URL de produção
```

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `ALL` | `/api/auth/*` | BetterAuth handler |
| `POST` | `/api/audio/upload` | Upload + transcrição + classificação |
| `GET` | `/api/audio/:key` | Servir áudio do R2 |
| `GET` | `/api/items` | Listar itens (query: `?type=reminder`) |
| `GET` | `/api/items/:id` | Item por ID |
| `PATCH` | `/api/items/:id` | Atualizar (completed, paid, etc.) |
| `DELETE` | `/api/items/:id` | Remover item e áudio do R2 |
| `POST` | `/api/admin/migrate` | Rodar migrations BetterAuth |
| `POST` | `/api/admin/seed` | Criar usuário único |
