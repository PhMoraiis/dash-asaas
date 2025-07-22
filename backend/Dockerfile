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

# Gera o Prisma Client com os binary targets corretos
RUN pnpm prisma generate

# Copia o restante do código
COPY . .

# Roda build (inclui tsc-alias para resolver path aliases)
RUN pnpm build

# Remove devDependencies para reduzir o tamanho da imagem
RUN pnpm prune --prod

# Gera o Prisma Client novamente após prune, pois foi removido
RUN pnpm prisma generate

# Exponha a porta padrão do Fastify
EXPOSE 3333

# Comando para rodar a aplicação
CMD ["pnpm", "start"]