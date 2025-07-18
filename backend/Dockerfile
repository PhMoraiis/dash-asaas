# Dockerfile para produção do backend
FROM node:23-alpine
WORKDIR /app

# Copia apenas os arquivos necessários para instalar dependências
COPY package.json pnpm-lock.yaml ./

# Instala pnpm globalmente
RUN npm install -g pnpm

# Instala apenas dependências de produção
RUN pnpm install --prod

# Copia o restante do código
COPY . .

# (Opcional) Rode build se necessário (ajuste se houver etapa de build TS)
RUN pnpm build

# Exponha a porta padrão do Fastify
EXPOSE 3333

# Comando para rodar a aplicação
CMD ["pnpm", "start"] 