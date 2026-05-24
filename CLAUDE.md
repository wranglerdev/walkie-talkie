# CLAUDE.md

## Documentação

Sempre use o context7 MCP para buscar documentação de bibliotecas, frameworks, SDKs, CLIs e serviços — mesmo os conhecidos como React, Next.js, Hono, Cloudflare Workers, etc. Não confie em dados de treinamento para detalhes de API; sempre verifique com context7.

## Testes

Siga TDD (Test-Driven Development) ao desenvolver funcionalidades:

1. Escreva o teste antes da implementação
2. Confirme que o teste falha (red)
3. Implemente o mínimo necessário para passar (green)
4. Refatore se necessário (refactor)

## Formulários e Validação

- Use TanStack Form (`@tanstack/react-form`) com Zod para todos os formulários do frontend
- Schemas Zod ficam em `shared/src/schemas/` e são importados por api e frontend via `@walkie-talkie/shared`
- Nunca duplique schemas: o mesmo objeto Zod valida tanto o frontend (via TanStack Form `validators.onChange`) quanto a API (via `schema.safeParse`)
- Para erros do servidor (ex: BetterAuth), use `useState` separado — não misture com erros de validação do formulário

## Cloudflare / Wrangler

Há uma sessão autenticada do Wrangler disponível via `npx wrangler`. Use-a para deploys, acesso a KV, D1, R2, e outros recursos Cloudflare sem precisar de login adicional.
