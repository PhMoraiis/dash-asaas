# Dashboard Webhooks Backend

Backend do Dashboard de Webhooks Asaas construído com Node.js, Elysia.js e TypeScript.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Elysia.js** - Framework web high-performance
- **TypeScript** - Tipagem estática
- **Prisma** - ORM e migrations
- **PostgreSQL** - Banco de dados
- **Redis** - Cache e filas
- **BullMQ** - Processamento de filas
- **Biome** - Linting e formatação

## 📦 Instalação

```bash
# Instalar Bun (se não tiver)
curl -fsSL https://bun.sh/install | bash

# Instalar dependências
bun install

# Configurar banco de dados
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Executar migrations
bun run db:push

# Seed inicial (opcional)
bun run db:seed
