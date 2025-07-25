# Dockerfile para produção do backend
FROM node:alpine
WORKDIR /app

RUN apk add --no-cache openssl3

# Instala pnpm globalmente
RUN npm install -g pnpm

# Copia apenas os arquivos necessários para instalar dependências
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instala dependências (incluindo devDependencies para build)
RUN pnpm install

# Copia o schema do Prisma primeiro
COPY prisma/ ./prisma/

RUN pnpm prisma generate

# Copia o restante do código
COPY . .

# Roda build (inclui tsc-alias para resolver path aliases)
RUN pnpm build

# Exponha a porta padrão do Fastify
EXPOSE 8080

# Copia o entrypoint para dentro do container
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Usa o entrypoint customizado
ENTRYPOINT ["/app/entrypoint.sh"]
