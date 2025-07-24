# Dashboard Webhooks Asaas

O **Dashboard Webhooks Asaas** é uma solução completa para gestão, recebimento, monitoramento e visualização de webhooks enviados pela plataforma Asaas. O sistema foi desenvolvido para facilitar a integração de revendas e administradores com eventos disparados pelo Asaas, fornecendo um painel intuitivo para acompanhamento e análise dos dados recebidos.

## ✨ O que o projeto faz?

- **Recebe webhooks do Asaas** de forma segura, validando tokens e armazenando os eventos recebidos.
- **Enfileira e processa os webhooks** de maneira assíncrona, garantindo idempotência e confiabilidade.
- **Permite que revendas e administradores** visualizem, filtrem e detalhem os eventos recebidos via painel web.
- **Oferece gerenciamento de produtos, revendas e administradores** com autenticação e controle de acesso.
- **Fornece configurações e instruções** para integração dos endpoints de webhook diretamente no painel.

## 🎯 Escopo

- Backend robusto em Node.js, Fastify e TypeScript, com banco de dados PostgreSQL e cache/filas Redis.
- Frontend moderno em Next.js, com interface amigável para acompanhamento dos webhooks e gestão dos dados.
- Suporte a múltiplos papéis de usuário (admin, revenda), cada um com permissões e visualizações específicas.
- Processamento de eventos com retries automáticos e dead letter queue para falhas.
- Documentação de API via Swagger integrada.

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js, Fastify, TypeScript, Prisma ORM, PostgreSQL, Redis, BullMQ, Biome
- **Frontend:** Next.js, React, TypeScript, TanStack Table, React Query
- **Infraestrutura:** Docker, Docker Compose

## 🚀 Como funciona?

1. **Revendas** cadastram produtos e recebem um token exclusivo para cada produto.
2. **No Asaas**, a revenda configura o endpoint de webhook fornecido pelo sistema, incluindo o token do produto no header.
3. **Quando um evento ocorre no Asaas**, ele é enviado para o endpoint, validado e armazenado.
4. **O painel web** permite visualizar todos os eventos recebidos, detalhes do payload, status de processamento e muito mais.

## 📦 Instalação

### Pré-requisitos

- Docker e Docker Compose
- Node.js (para desenvolvimento local)
- Bun (opcional, para scripts do backend)

### Passos

1. Clone o repositório:
   ```bash
   git clone https://github.com/PhMoraiis/asaas.git
   cd asaas
   ```

2. Configure o seu arquivo .env.example para .env

3. Suba a infraestrutura:
   ```bash
   docker-compose up -d
   ```

## 📊 Exemplos de uso

- Visualização de todos os webhooks recebidos por produto.
- Filtros por evento, data, produto e status.
- Detalhamento do payload de cada evento.
- Geração e visualização de gráficos customizados (charts) para análise dos dados.

## 🔒 Segurança

- Autenticação JWT para todas as rotas privadas.
- Tokens exclusivos para cada produto/revenda.
- Validação de eventos para evitar duplicidade (idempotência).

## 📝 Licença

MIT
