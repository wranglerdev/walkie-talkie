# CLAUDE.md

## Documentação

Sempre use o context7 MCP para buscar documentação de bibliotecas, frameworks, SDKs, CLIs e serviços — mesmo os conhecidos como React, Next.js, Hono, Cloudflare Workers, etc. Não confie em dados de treinamento para detalhes de API; sempre verifique com context7.

## Testes

Siga TDD (Test-Driven Development) ao desenvolver funcionalidades:

1. Escreva o teste antes da implementação
2. Confirme que o teste falha (red)
3. Implemente o mínimo necessário para passar (green)
4. Refatore se necessário (refactor)

## Cloudflare / Wrangler

Há uma sessão autenticada do Wrangler disponível via `npx wrangler`. Use-a para deploys, acesso a KV, D1, R2, e outros recursos Cloudflare sem precisar de login adicional.
