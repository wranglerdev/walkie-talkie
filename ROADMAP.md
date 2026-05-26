# Roadmap — Walkie-Talkie MVP

> Estado atual: scaffolds criados (`api/` com Hono bare-bones, `frontend/` com Vite + React).
> Para retomar após interrupção: ler este arquivo, ver último commit em `git log --oneline`, continuar na fase seguinte.

---

## Como usar este roadmap

Cada fase termina com um **commit semântico**. Para retomar:

1. `git log --oneline` → identifica último commit
2. Localiza a fase correspondente abaixo
3. Inicia a próxima fase marcada com `[ ]`

Convenção de commits:

- `chore:` — setup, config, dependências
- `feat:` — nova funcionalidade
- `fix:` — correção
- `test:` — testes

---

## Fase 0 — Git + Monorepo Base

- [x] Inicializar git (`git init`)
- [x] Criar `.gitignore` raiz
- [x] Criar `package.json` raiz com workspaces (`api`, `frontend`)
- [x] Primeiro commit

**Commit:** `chore: initialize monorepo with api and frontend workspaces`

---

## Fase 1 — Backend: Schema + Drizzle + D1

Dependências: `drizzle-orm`, `drizzle-kit`, `@cloudflare/workers-types`

- [x] Instalar dependências em `api/`
- [x] Criar `api/src/db/schema.ts` — tabela `items` (id cuid2, type, title, transcript, audioUrl, createdAt, updatedAt, dueDate, completed, paid, metadata)
- [x] Criar migration com `drizzle-kit`
- [x] Provisionar D1 database via `wrangler d1 create walkie-talkie-db`
- [x] Atualizar `api/wrangler.jsonc` com binding D1 (`DB`)
- [x] Aplicar migration no D1 local e remoto
- [x] Atualizar `api/src/index.ts` para aceitar env com `DB`

**Commit:** `feat(api): add D1 database with drizzle schema for items`

---

## Fase 2 — Backend: BetterAuth (single-user)

Dependências: `better-auth`, `@better-auth/cli`

- [x] Instalar `better-auth` em `api/`
- [x] Criar `api/src/auth.ts` com `betterAuth` + `drizzleAdapter` (sqlite, D1)
- [x] Gerar tabelas BetterAuth (`user`, `session`, `account`, `verification`) via migration
- [x] Adicionar tabelas BetterAuth ao `schema.ts` do Drizzle
- [x] Criar middleware em `api/src/index.ts`:
  - Bloquear `POST /api/auth/sign-up/*` → 403
  - Passar `ALL /api/auth/*` → BetterAuth handler
- [x] Criar `api/src/middleware/session.ts` — valida sessão em `/api/*`
- [x] Criar script `api/scripts/seed-user.ts` — insere usuário único via BetterAuth API
- [x] Documentar como rodar seed no README

**Commit:** `feat(api): add BetterAuth single-user auth with D1 adapter`

---

## Fase 3 — Backend: R2 + Rotas de Items

Dependências: sem novas

- [x] Provisionar R2 bucket: `wrangler r2 bucket create walkie-talkie-audio`
- [x] Atualizar `api/wrangler.jsonc` com binding R2 (`AUDIO_BUCKET`)
- [x] Criar `api/src/routes/items.ts`:
  - `GET  /api/items` — lista itens do usuário
  - `GET  /api/items/:id` — item por id
  - `PATCH /api/items/:id` — atualiza (completed, paid, etc.)
  - `DELETE /api/items/:id` — remove item
- [x] Registrar rotas no `api/src/index.ts`
- [x] Aplicar middleware de sessão em todas as rotas `/api/*`

**Commit:** `feat(api): add items CRUD routes with session middleware`

---

## Fase 4 — Backend: Upload de Áudio + IA

Dependências: `openai` (OpenRouter-compatible), `@paralleldrive/cuid2`

- [x] Instalar dependências em `api/`
- [x] Adicionar envs em `wrangler.jsonc`: `OPENROUTER_API_KEY`, `USER_TIMEZONE` (`America/Sao_Paulo`)
- [x] Criar `api/src/services/transcription.ts` — envia audio para OpenRouter Grok STT
- [x] Criar `api/src/services/classifier.ts` — LLM classifier com prompt do PRD (extrai category, title, dueDate, amount, paid, tags, confidence)
- [x] Criar `api/src/routes/audio.ts`:
  - `POST /api/audio/upload` — recebe `audio` blob + `duration`
  - Salva no R2
  - Transcreve via Grok STT
  - Classifica via LLM
  - Salva item no D1
  - Retorna item criado
- [x] Registrar rota no `api/src/index.ts`

**Commit:** `feat(api): add audio upload with STT transcription and LLM classification`

---

## Fase 5 — Frontend: Tailwind v4 + daisyUI v5

Dependências: `tailwindcss`, `daisyui`

- [x] Instalar `tailwindcss` e `daisyui` em `frontend/`
- [x] Atualizar `frontend/src/index.css`:

  ```css
  @import "tailwindcss";
  @plugin "daisyui";
  ```

- [x] Configurar tema `night` no plugin daisyUI
- [x] Atualizar `frontend/vite.config.ts` — adicionar `@tailwindcss/vite` plugin
- [x] Remover `App.css` e boilerplate do Vite
- [x] Verificar que classes daisyUI funcionam com componente placeholder

**Commit:** `chore(frontend): setup Tailwind v4 and daisyUI v5 with night theme`

---

## Fase 6 — Frontend: Auth Client + Login

Dependências: `better-auth` (client)

- [x] Instalar `better-auth` em `frontend/`
- [x] Criar `frontend/src/lib/auth-client.ts` — `createAuthClient` apontando para `/api/auth`
- [x] Criar `frontend/src/pages/LoginPage.tsx` — card centralizado, email + senha, `btn btn-primary btn-block`, sem "criar conta"
- [x] Criar `frontend/src/hooks/useSession.ts` — hook que retorna sessão atual
- [x] Criar rota guard em `frontend/src/App.tsx` — redireciona para login se não autenticado
- [x] Configurar proxy no `vite.config.ts` para `/api` → `http://localhost:8787`

**Commit:** `feat(frontend): add login page and auth client with session guard`

---

## Fase 7 — Frontend: Componente de Gravação

Dependências: sem novas

- [x] Criar `frontend/src/hooks/useRecorder.ts`:
  - Estado: `idle | recording | processing | error`
  - `startRecording()` — `getUserMedia` + `MediaRecorder`
  - `stopRecording()` → retorna `Blob` (webm/opus)
  - Calcula duração
- [x] Criar `frontend/src/components/MicButton.tsx`:
  - `btn btn-circle btn-primary` escalado (~5rem)
  - `onPointerDown` → inicia gravação
  - `onPointerUp` → encerra e faz upload
  - Estado idle: ícone mic SVG
  - Estado recording: `ring ring-error animate-pulse`
  - Estado processing: `loading loading-ring`
- [x] Criar `frontend/src/api/client.ts` — wrapper fetch tipado para rotas da API

**Commit:** `feat(frontend): add MediaRecorder hook and mic button component`

---

## Fase 8 — Frontend: Home Page

Dependências: sem novas

- [x] Criar `frontend/src/pages/HomePage.tsx`:
  - Layout centralizado (`hero` ou flex column)
  - `MicButton` centralizado
  - Exibe último item salvo como `card card-compact` abaixo do botão
  - Mensagem de boas-vindas quando não há itens
- [x] Criar `frontend/src/components/ItemCard.tsx` — card compacto com badge de categoria e título
- [x] Criar `frontend/src/components/BottomNav.tsx` — `btm-nav` com Home e Histórico
- [x] Integrar `BottomNav` no layout raiz

**Commit:** `feat(frontend): add home page with mic button and last item preview`

---

## Fase 9 — Frontend: Página de Histórico

Dependências: sem novas

- [x] Criar `frontend/src/pages/HistoryPage.tsx`:
  - Busca `GET /api/items` ao montar
  - Lista de `card` por item com `badge` colorido por categoria
  - Filtros via `tabs tabs-boxed`: Todos / Reminder / Note / Bill / Idea
  - Estado de carregamento: `loading loading-spinner`
  - Estado vazio: mensagem informativa
- [x] Mapear cores de badge por categoria:
  - `reminder` → `badge-primary`
  - `bill` → `badge-warning`
  - `note` → `badge-info`
  - `idea` → `badge-secondary`
  - `shopping` → `badge-success`
  - `journal` → `badge-ghost`
- [x] Ações inline: marcar reminder como concluído, marcar bill como pago

**Commit:** `feat(frontend): add history page with category filters and item actions`

---

## Fase 10 — Frontend: PWA

Dependências: `vite-plugin-pwa`

- [x] Instalar `vite-plugin-pwa` em `frontend/`
- [x] Configurar plugin no `vite.config.ts`:
  - `name`: "Walkie-Talkie"
  - `short_name`: "WalkieTalkie"
  - `theme_color`: cor do tema night daisyUI
  - `display`: "standalone"
  - `icons`: 192x192, 512x512 (gerar placeholders)
- [x] Criar `frontend/public/manifest.json` se necessário
- [x] Testar instalação PWA no browser

**Commit:** `feat(frontend): add PWA manifest and service worker via vite-plugin-pwa`

---

## Fase 11 — Integração & Deploy

- [x] Testar fluxo completo: login → gravar → ver item classificado → histórico
- [x] Deploy da API: `cd api && npx wrangler deploy`
- [x] Build + deploy do frontend via Cloudflare Pages ou Workers Assets
- [x] Rodar seed do usuário único em produção
- [x] Documentar variáveis de ambiente necessárias no README raiz

**Commit:** `chore: finalize deploy config and document environment variables`

---

## Resumo das Fases

| Fase | Área     | O que faz                                  | Status |
|------|----------|--------------------------------------------|--------|
| 0    | Infra    | Git + monorepo                             | [ ]    |
| 1    | API      | Schema Drizzle + D1                        | [ ]    |
| 2    | API      | BetterAuth single-user                     | [ ]    |
| 3    | API      | R2 + CRUD de items                         | [ ]    |
| 4    | API      | Upload áudio + STT + LLM                   | [ ]    |
| 5    | Frontend | Tailwind v4 + daisyUI v5                   | [ ]    |
| 6    | Frontend | Login + auth client                        | [ ]    |
| 7    | Frontend | Hook gravação + MicButton                  | [ ]    |
| 8    | Frontend | Home page                                  | [ ]    |
| 9    | Frontend | Histórico + filtros                        | [ ]    |
| 10   | Frontend | PWA                                        | [ ]    |
| 11   | Infra    | Deploy + seed produção                     | [ ]    |

---

## Variáveis de Ambiente (API)

| Variável              | Descrição                              |
|-----------------------|----------------------------------------|
| `OPENROUTER_API_KEY`  | Chave da API OpenRouter                |
| `USER_TIMEZONE`       | Timezone do usuário (America/Sao_Paulo)|
| `BETTER_AUTH_SECRET`  | Secret do BetterAuth (min 32 chars)    |

---

## Decisões Arquiteturais Relevantes

- **Monorepo simples**: `api/` e `frontend/` como workspaces npm separados (sem Turborepo).
- **Auth**: BetterAuth com adapter Drizzle/D1. Sem registro público — seed único.
- **STT**: OpenRouter + `x-ai/grok-2-vision-1212` ou equivalente com suporte a áudio.
- **Frontend proxy**: Vite proxia `/api` para `localhost:8787` em dev.
- **daisyUI v5**: importado via CSS (`@plugin "daisyui"`), não como plugin Vite.

logica fuzzy nos contatos e nos projetos
