# 📋 Checklist Completo - Dashboard Webhooks Asaas

## **🚀 FASE 1: Setup Inicial e Estrutura da API (Concluído)**

### 1.1 Configuração do Ambiente

- [x] Inicializar e configurar projeto back-end (Node.js + Fastify)
- [x] Configurar Docker Compose (PostgreSQL + Redis, Back-end, BullMQ)
- [x] Configurar variáveis de ambiente (.env)
- [x] Configurar TypeScript e Biome

### 1.2 Banco de Dados

- [x] Configurar Prisma
- [x] Criar schema do banco (Admin, Revenda, Produto, Webhook)
- [x] Adicionar campo `webhookToken` na tabela Revenda
- [x] Adicionar campo `externalId` para integração com sistema externo
- [x] Executar primeira migração
- [x] Configurar seed inicial (dados de teste)

### 1.3 Sistema de Filas

- [x] Configurar Redis
- [x] Configurar Bull/BullMQ
- [x] Criar estrutura básica de filas
- [x] Configurar worker para processamento
- [x] Implementar dead letter queue
- [x] Configurar retry automático para falhas

### 1.4 Estrutura da API

- [x] Configurar Fastify com TypeScript
- [x] Configurar middleware de autenticação
- [x] Configurar middleware de validação (Zod)
- [x] Configurar middleware de logging
- [x] Configurar tratamento de erros

## **🔑 FASE 2: Autenticação e Layout Base (Backend + Frontend)**
*(Objetivo: Ter um sistema onde o usuário pode se autenticar e ver a estrutura inicial do dashboard)*

### 2.1 Backend - Autenticação e Autorização (Concluído)

- [x] Implementar JWT para autenticação (Admin/Revenda).
- [x] Criar endpoints de login/logout com cookies seguros.
- [x] Implementar autorização por role (níveis de acesso Admin/Revenda).
- [x] Criar rota secreta para bootstrap de admin.

### 2.2 Frontend - Setup Inicial

- [x] Configurar Next.js 15 com App Router
- [x] Configurar Tailwind CSS
- [x] Configurar shadcn/ui
- [x] Configurar tema claro/escuro
- [x] Configurar TypeScript
- [x] Configurar internacionalização (i18n)

### 2.3 Frontend - Autenticação

- [x] Configurar auth personalizado para consumir a API
- [x] Criar páginas de login
- [x] Criar botão de logout
- [x] Implementar proteção de rotas (client-side e server-side)
- [x] Criar contexto de autenticação global
- [x] Implementar refresh token automático (frontend e backend)

## **🏢 FASE 3: Gerenciamento de Revendas (Admin - Backend + Frontend)**
*(Objetivo: O admin poderá logar e gerenciar as revendas)*

### 3.1 Backend - Endpoints de Gerenciamento

- [ ] **POST** `/api/admin/revendas` - Criar revenda
- [ ] **GET** `/api/admin/revendas` - Listar revendas
- [ ] **PUT** `/api/admin/revendas/:id` - Editar revenda
- [ ] **DELETE** `/api/admin/revendas/:id` - Desativar revenda

### 3.2 Frontend - Interface de Gestão de Revendas

- [ ] Página para listar revendas
- [ ] Formulário/Modal para criar nova revenda
- [ ] Formulário/Modal para editar/desativar revenda
- [ ] Visualizar produtos e status de webhooks por revenda

## **📦 FASE 4: Gerenciamento de Produtos (Revenda - Backend + Frontend)**
*(Objetivo: A revenda poderá logar e gerenciar seus produtos)*

### 4.1 Backend - Endpoints de Gerenciamento

- [ ] **POST** `/api/produtos` - Criar produto
- [ ] **GET** `/api/produtos` - Listar produtos
- [ ] **PUT** `/api/produtos/:id` - Editar produto
- [ ] **DELETE** `/api/produtos/:id` - Deletar produto

### 4.2 Frontend - Interface de Gestão de Produtos

- [ ] Página para listar produtos
- [ ] Formulário/Modal para criar novo produto
- [ ] Formulário/Modal para editar produto
- [ ] Visualizar webhooks por produto

## **🔗 FASE 5: Configuração e Recebimento de Webhooks (Backend + Frontend)**
*(Objetivo: A revenda poderá configurar e o sistema começará a receber webhooks)*

### 5.1 Backend - Endpoints

- [ ] **GET** `/api/revenda/webhook-config` - Obter configuração do webhook (URL e token)
- [ ] **POST** `/api/revenda/webhook-token` - Gerar novo token
- [ ] **POST** `/api/webhooks/asaas` - Receber webhooks com token no header (validar e enfileirar)
- [ ] **POST** `/api/webhooks/asaas/:revendaId` - Receber webhooks por ID (outra forma de identificação)

### 5.2 Frontend - Interface de Configuração de Webhooks

- [ ] Página de configuração de webhook
- [ ] Exibir URL única do webhook e token de autenticação
- [ ] Botão para copiar URL/token
- [ ] Botão para regenerar token
- [ ] Instruções passo-a-passo para configuração no Asaas

## **📊 FASE 6: Visualização de Webhooks e Dashboard (Backend + Frontend)**
*(Objetivo: O usuário poderá ver os webhooks recebidos e um dashboard com estatísticas)*

### 6.1 Backend - Endpoints

- [ ] **GET** `/api/webhooks` - Listar todos os webhooks com filtros
- [ ] **GET** `/api/webhooks/:id` - Detalhes do webhook
- [ ] **PUT** `/api/webhooks/:id/reprocess` - Reprocessar webhook
- [ ] **GET** `/api/stats` - Estatísticas para o dashboard

### 6.2 Frontend - Interfaces

- [ ] **Página de Webhooks:** Listar, filtrar, buscar, ver detalhes (JSON viewer) e reprocessar webhooks.
- [ ] **Dashboard Principal:** Página inicial com estatísticas, gráficos e lista de webhooks recentes.

## **🛠️ FASE 7: Scripts e Utilitários (Backend)**

### 7.1 Script de Importação e Sincronização

- [ ] Criar script para importar base existente de revendas/produtos
- [ ] Script/Cron job para sincronização de usuários com sistema externo

### 7.2 Monitoramento e Manutenção

- [ ] Configurar sistema de logs (Winston/Pino)
- [ ] Implementar health checks
- [ ] Scripts de limpeza de logs/webhooks antigos

## **🔒 FASE 8: Segurança e Performance (Backend + Frontend)**

### 8.1 Segurança

- [ ] Implementar rate limiting
- [ ] Validar e sanitizar todos os inputs
- [ ] Configurar CORS, CSP
- [ ] Criptografar dados sensíveis

### 8.2 Performance

- [ ] Implementar cache com Redis
- [ ] Otimizar queries do banco
- [ ] Implementar paginação em todas as listas
- [ ] Otimizar bundle do frontend (Lazy loading, etc.)

### 8.3 Testes

- [ ] Testes unitários, de integração e E2E

## **🚀 FASE 9: Deploy e Produção (Infraestrutura)**

- [ ] Containerização (Dockerfiles para produção)
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Configurar infraestrutura em nuvem (AWS/GCP/DigitalOcean)
- [ ] Configurar monitoramento e alertas (APM, logs centralizados)

## **💡 FASE 10: Melhorias Contínuas e Features Avançadas**
*(Itens a serem avaliados após o MVP)*

- [ ] Webhooks outbound (notificar terceiros)
- [ ] API GraphQL (opcional)
- [ ] Implementar PWA completo
- [ ] Integrações futuras (Slack, Email, etc.)
