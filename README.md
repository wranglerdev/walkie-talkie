# Walkie-Talkie

Um agente pessoal de lembretes por voz. Você segura o botão, fala, solta — e a IA transcreve, categoriza e salva automaticamente.

Pensado para uso próprio: sem cadastro público, sem multi-usuário, sem dashboard de gestão. Só você e seus pensamentos.

**Estado atual: MVP funcional.** O fluxo completo está implementado — login, gravação, transcrição, classificação e histórico com filtros.

---

## O que ele faz

Você abre o app, segura o botão de microfone, fala qualquer coisa em linguagem natural e solta. Em menos de 10 segundos o item aparece organizado no histórico.

O sistema entende expressões como "me lembra de pagar o aluguel sexta", "tive uma ideia para um app de plantas" ou "gastei 40 reais no mercado hoje". A IA decide a categoria, extrai datas e valores, e cria um item estruturado — sem você precisar preencher nada.

Categorias do MVP: `reminder`, `note`, `bill`, `idea`, `shopping`, `journal`.

---

## Como funciona por baixo

```
Navegador (React PWA)
    ↓  sessão via cookie
Cloudflare Worker (Hono)
    ├── BetterAuth — autenticação
    ├── R2 — armazena o áudio
    ├── OpenRouter / Grok — transcrição de voz
    ├── LLM — classifica e extrai estrutura
    └── D1 — salva o item
```

---

## Requisitos

### Conta Cloudflare

Você precisa de uma conta Cloudflare com o plano Workers Paid ativo. O plano gratuito não suporta Queues, que o projeto usa para confirmar itens em background.

Recursos que serão provisionados:
- **Workers** — para rodar a API
- **D1** — banco de dados SQLite gerenciado
- **R2** — armazenamento dos arquivos de áudio
- **Queues** — processamento assíncrono de confirmação de itens

### Chave OpenRouter

O projeto usa o OpenRouter para transcrição de voz via Grok. Crie uma conta em [openrouter.ai](https://openrouter.ai) e gere uma chave de API.

### Wrangler autenticado

```bash
npx wrangler login
```

---

## Deploy do seu próprio

### 1. Clone e instale dependências

```bash
git clone <seu-fork>
cd walkie-talkie
npm install
```

### 2. Provisione os recursos na Cloudflare

```bash
# Banco de dados D1
npx wrangler d1 create walkie-talkie-db

# Bucket R2 para áudios
npx wrangler r2 bucket create walkie-talkie-audio

# Fila para confirmação automática
npx wrangler queues create item-auto-confirm
```

Após criar o D1, o comando vai retornar um `database_id`. Atualize o arquivo `api/wrangler.jsonc` com esse ID:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "walkie-talkie-db",
    "database_id": "SEU-ID-AQUI"
  }
]
```

### 3. Configure as variáveis de ambiente

Crie o arquivo `api/.dev.vars` para desenvolvimento local:

```env
BETTER_AUTH_SECRET=<string aleatória de pelo menos 32 caracteres>
BETTER_AUTH_URL=http://localhost:5173
ADMIN_SECRET=<string aleatória para proteger endpoints de admin>
OPENROUTER_API_KEY=<sua chave do OpenRouter>
```

Para gerar os valores:

```bash
# BETTER_AUTH_SECRET
openssl rand -hex 32

# ADMIN_SECRET
openssl rand -hex 16
```

Em produção, configure os secrets via Wrangler:

```bash
cd api
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BETTER_AUTH_URL      # URL pública do seu Worker
npx wrangler secret put ADMIN_SECRET
npx wrangler secret put OPENROUTER_API_KEY
```

### 4. Rode as migrations

Com a API rodando localmente (`cd api && npm run dev`):

```bash
# Migrations do schema principal (tabela items)
cd api && npm run db:migrate:local

# Migrations do BetterAuth (tabelas de usuário e sessão)
cd api && npm run auth:migrate:local
```

Ou use o endpoint admin se preferir via curl:

```bash
curl -X POST http://localhost:8787/api/admin/migrate \
  -H "x-admin-secret: seu-admin-secret"
```

### 5. Crie o usuário único

O app não tem registro público — você cria seu usuário uma vez via seed.

Usando o script:

```bash
# Crie um arquivo .env na raiz do projeto com:
# ADMIN_SECRET=...
# SEED_EMAIL=seu@email.com
# SEED_PASSWORD=suasenha
# SEED_NAME=Seu Nome

cd api && npm run seed:local
```

Ou via curl:

```bash
curl -X POST http://localhost:8787/api/admin/seed \
  -H "x-admin-secret: seu-admin-secret" \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"suasenha","name":"Seu Nome"}'
```

### 6. Desenvolvimento local

```bash
# Terminal 1: API (porta 8787)
cd api && npm run dev

# Terminal 2: Frontend (porta 5173)
cd frontend && npm run dev
```

O Vite já está configurado para proxiar `/api` para `localhost:8787`.

### 7. Deploy em produção

```bash
# Deploy da API
cd api && npm run deploy
```

Para o frontend, use Cloudflare Pages ou Workers Assets. Após o deploy, repita as migrations e o seed apontando para a URL de produção:

```bash
cd api && npm run migrate:remote
cd api && npm run seed:remote   # requer BETTER_AUTH_URL no .env
```

---

## Variáveis de ambiente

| Variável | Onde | Descrição |
|---|---|---|
| `BETTER_AUTH_SECRET` | API | Secret mínimo 32 chars para assinar sessões |
| `BETTER_AUTH_URL` | API | URL base do app (usada no CORS e cookies) |
| `ADMIN_SECRET` | API | Protege os endpoints `/api/admin/*` |
| `OPENROUTER_API_KEY` | API | Chave para transcrição e classificação via IA |
| `USER_TIMEZONE` | `wrangler.jsonc` | Timezone para interpretar datas relativas (padrão: `America/Sao_Paulo`) |

---

## Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| `ALL` | `/api/auth/*` | Handler do BetterAuth |
| `POST` | `/api/audio/upload` | Upload de áudio, transcrição e classificação |
| `GET` | `/api/audio/:key` | Servir áudio armazenado no R2 |
| `GET` | `/api/items` | Listar itens (filtro opcional: `?type=reminder`) |
| `GET` | `/api/items/:id` | Buscar item por ID |
| `PATCH` | `/api/items/:id` | Atualizar item (completed, paid, etc.) |
| `DELETE` | `/api/items/:id` | Remover item e áudio do R2 |
| `POST` | `/api/admin/migrate` | Rodar migrations (requer `x-admin-secret`) |
| `POST` | `/api/admin/seed` | Criar o usuário único (requer `x-admin-secret`) |

---

## Estrutura do projeto

```
walkie-talkie/
├── api/          Hono + Cloudflare Workers
│   ├── src/
│   │   ├── routes/       items.ts, audio.ts
│   │   ├── services/     transcription.ts, classifier.ts
│   │   ├── db/           schema Drizzle
│   │   └── middleware/   session.ts
│   └── scripts/  migrations e seed
├── frontend/     Vite + React + PWA
│   └── src/
│       ├── pages/        LoginPage, HomePage, HistoryPage
│       ├── components/   MicButton, ItemCard, BottomNav
│       └── hooks/        useRecorder, useSession
└── shared/       schemas Zod compartilhados entre api e frontend
```

---

## O que não está no MVP

- Registro público ou múltiplos usuários
- Push notifications (planejado pós-MVP)
- Busca semântica ("tudo que falei sobre finanças")
- Fila offline para gravações sem conexão
- Resumo diário ou agente proativo
