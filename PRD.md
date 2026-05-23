# PRD — MVP "Reminder Agent" (Natural Language Voice Reminders)

## Visão Geral

Aplicativo minimalista focado em captura rápida de pensamentos, tarefas e contas via voz.

O usuário abre o app, segura o botão de microfone, fala naturalmente e solta. O sistema:

1. Grava o áudio
2. Envia para o backend na Cloudflare via Hono
3. Transcreve usando OpenRouter + Grok
4. Classifica automaticamente o conteúdo
5. Salva como item estruturado

A experiência precisa ser extremamente rápida, quase como usar um "walkie-talkie mental".

---

## Objetivo do MVP

Criar um agente simples de captura de lembretes por voz usando linguagem natural.

O foco NÃO é produtividade enterprise.

O foco é:

* velocidade
* baixa fricção
* captura instantânea
* organização automática
* experiência mobile-first

---

## Stack Técnica

### Frontend

* Vite
* React
* **Tailwind CSS v4**
* **daisyUI v5** (compatível com Tailwind v4)
* PWA-first
* Gravação via MediaRecorder API

> **Nota:** daisyUI v5 foi reescrito para Tailwind v4. Não usar `@tailwindcss/vite` com `daisyui` como plugin — no Tailwind v4, daisyUI é importado via CSS:
>
> ```css
> @import "tailwindcss";
> @plugin "daisyui";
> ```
>
> Classes daisyUI usam a sintaxe nova do Tailwind v4 (sem prefixo `tw-`).

### Backend

* Hono
* Cloudflare Workers
* Cloudflare D1
* Cloudflare R2 (armazenamento dos áudios)
* Cloudflare KV (cache rápido opcional)

### Auth

* **BetterAuth** — modo single-user
* Sem registro público — apenas um usuário pré-criado via seed/script
* Sessão persistida via cookie HTTP-only
* Adapter: `better-auth/adapters/drizzle` (D1 + Drizzle ORM)

### IA

* OpenRouter
* Modelo Grok Speech-to-Text
* Classificação semântica via LLM

---

## Autenticação — Single User

O app é para uso pessoal exclusivo. A estratégia é:

### Configuração BetterAuth

```ts
// worker/src/auth.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

export function createAuth(db: DrizzleD1Database) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite" }),
    emailAndPassword: {
      enabled: true,
    },
    // Sem socialProviders, sem magic link, sem registro público
  })
}
```

### Bloqueio de registro

Middleware no Hono que rejeita qualquer tentativa de criar novo usuário além do seed:

```ts
app.use("/api/auth/sign-up/*", async (c, next) => {
  return c.json({ error: "Registration is disabled." }, 403)
})

// Passa o restante para o BetterAuth handler
app.all("/api/auth/*", (c) => auth.handler(c.req.raw))
```

### Seed do usuário único

Script rodado uma vez via `wrangler d1 execute`:

```ts
// scripts/seed-user.ts
// Cria o único usuário com email/senha via BetterAuth internamente
// ou insere diretamente na tabela `user` com senha hasheada (bcrypt)
```

### Proteção das rotas da API

Middleware de sessão aplicado globalmente:

```ts
app.use("/api/*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: "Unauthorized" }, 401)
  c.set("user", session.user)
  await next()
})
```

### Tela de login (Frontend)

Tela única de email + senha usando componentes daisyUI (`input`, `btn`, `form-control`, `label`). Sem botão de "criar conta".

---

## Fluxo Principal

### 1. Captura de voz

Tela principal possui:

* botão central de microfone (daisyUI `btn btn-circle btn-primary` de tamanho grande)
* feedback visual de gravação (anel pulsante via Tailwind `animate-ping` ou custom)
* waveform simples opcional
* navegação inferior via daisyUI `btm-nav`:
  * Home
  * Histórico

#### Interação

* Usuário segura botão → gravação inicia
* Usuário solta botão → gravação encerra → upload automático
* Estado `processing` exibe daisyUI `loading loading-spinner`

---

### 2. Upload

Frontend envia:

```json
{
  "audio": "blob",
  "duration": 12
}
```

Para:

```
POST /api/audio/upload
```

---

### 3. Processamento

Backend:

1. Salva áudio no R2
2. Envia para OpenRouter (Grok STT)
3. Recebe transcrição
4. Executa classificação via LLM
5. Extrai possíveis datas
6. Salva resultado estruturado no D1

---

## Categorias do MVP

### 1. Reminder

```ts
{ title, transcript, dueDate?, completed }
```

Exemplos: *"Me lembra de pagar a internet amanhã"*, *"Comprar café sexta"*

---

### 2. Note

```ts
{ title, transcript, tags? }
```

Exemplos: *"Ideia para um SaaS de CRM"*, *"Lembrar que o cliente prefere tema escuro"*

---

### 3. Bill

```ts
{ title, amount?, dueDate?, paid, category? }
```

Exemplos: *"Paguei 40 reais no almoço"*, *"Assinatura da OpenAI vence mês que vem"*

---

## Categorias Extras (MVP Opcional)

| Categoria  | Descrição               | Exemplo                         |
| ---------- | ----------------------- | ------------------------------- |
| `idea`     | Startups, features      | "App de rastreamento de frangos"|
| `shopping` | Lista de compras        | "Comprar cabo USB-C"            |
| `journal`  | Mini diário falado      | "Hoje foi um dia produtivo"     |

---

## Classificação Inteligente

O LLM retorna:

```json
{
  "category": "reminder",
  "title": "Pagar internet",
  "transcript": "...",
  "dueDate": "2026-05-24",
  "confidence": 0.94
}
```

---

## Parsing de Linguagem Natural

O sistema deve entender expressões em pt-BR:

* `amanhã`, `hoje`, `sexta`, `mês que vem`
* `daqui 2 horas`, `no final do dia`, `semana que vem`

Resolvidas server-side com base no timezone do usuário (configurável via env).

---

## Estrutura das Rotas

```
POST   /api/audio/upload
GET    /api/items
GET    /api/items/:id
PATCH  /api/items/:id
DELETE /api/items/:id

ALL    /api/auth/*      → BetterAuth handler
```

---

## Modelo de Dados (D1 + Drizzle)

### `items`

```ts
{
  id:         string      // cuid2
  type:       'reminder' | 'note' | 'bill' | 'idea' | 'shopping' | 'journal'
  title:      string
  transcript: string
  audioUrl:   string?     // R2 URL
  createdAt:  Date
  updatedAt:  Date
  dueDate:    Date?
  completed:  boolean?    // reminder, shopping
  paid:       boolean?    // bill
  metadata:   Json?       // amount, tags, category, confidence, etc.
}
```

### Tabelas BetterAuth (geradas via migration)

`user`, `session`, `account`, `verification` — padrão do BetterAuth com adapter Drizzle.

---

## UI do MVP (daisyUI + Tailwind v4)

### Tema

Usar tema daisyUI `night` ou customizado via `@plugin "daisyui" { themes: [...] }`. App escuro por padrão — uso noturno é comum para captura rápida.

### Home

* `hero` ou layout centralizado com botão de gravação
* Botão: `btn btn-circle btn-primary` escalado (tamanho ~5rem)
* Estado idle: ícone de microfone
* Estado recording: `ring ring-error animate-pulse`
* Estado processing: `loading loading-ring`
* Último item salvo exibido como `card card-compact` abaixo do botão

### Histórico

Lista com `card` por item, `badge` colorido por categoria:

```
[reminder]  Pagar internet amanhã
[bill]      Mercado R$120
[idea]      SaaS de lembretes por voz
```

Filtros via `tabs tabs-boxed` ou `join` de botões daisyUI:

* Todos / Reminder / Note / Bill / Idea

### Login

* `card` centralizado com `form-control`
* Campos `input input-bordered`
* Botão `btn btn-primary btn-block`
* Sem link "criar conta"

---

## Experiência do Usuário

Zero fricção. O usuário não deve:

* preencher formulários
* categorizar manualmente
* escolher datas
* digitar títulos

Tudo inferido pela IA.

---

## Prompting do LLM

```
Você é um parser de lembretes pessoais em português brasileiro.

Data/hora atual: {ISO_DATETIME} (timezone: America/Sao_Paulo)

Analise o transcript de voz e extraia:
- category: reminder | note | bill | idea | shopping | journal
- title: título curto (máx 60 chars)
- dueDate: ISO 8601 se houver referência temporal
- amount: número em BRL se houver valor monetário
- paid: boolean se for bill já pago
- tags: array de strings se for note
- confidence: 0.0 a 1.0

Retorne APENAS JSON válido, sem markdown.
```

---

## Arquitetura

```
Browser (Vite React PWA)
    │  BetterAuth session cookie
    ↓
Hono Worker (Cloudflare)
    ├─ Auth middleware (BetterAuth)
    ├─ POST /api/audio/upload
    │       ├─ R2 (store audio)
    │       ├─ OpenRouter Grok STT
    │       ├─ LLM Classifier
    │       └─ D1 (save item)
    └─ GET/PATCH/DELETE /api/items
```

---

## MVP Scope

O MVP NÃO precisa:

* registro público ou multi-tenant
* colaboração
* calendário visual
* sincronização externa
* push notifications (pós-MVP)
* busca semântica (pós-MVP)
* offline queue (pós-MVP)

---

## Funcionalidades Pós-MVP

| Feature              | Descrição                                        |
| -------------------- | ------------------------------------------------ |
| Push Notifications   | Web Push / Telegram / WhatsApp                  |
| Daily Digest         | Resumo diário dos itens do dia                  |
| Memória Inteligente  | Relacionar contexto entre itens                 |
| Busca Semântica      | "coisas que falei sobre SaaS"                   |
| Agente Proativo      | "Você mencionou aluguel 3 vezes essa semana"    |
| Offline Queue        | Gravações enfileiradas sem conexão              |

---

## Critério de Sucesso

O usuário consegue:

1. Abrir o app
2. Gravar uma frase
3. Ver o item categorizado automaticamente
4. Encontrar depois no histórico

**Em menos de 10 segundos.**

---

## Diferencial do Produto

> "Pensar em voz alta e deixar a IA organizar sua mente automaticamente."

---
