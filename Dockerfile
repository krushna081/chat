FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/

RUN npm ci \
  && npm ci --prefix server \
  && npm ci --prefix client

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV SERVE_CLIENT=true
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-5000}/api/health" >/dev/null || exit 1

CMD ["npm", "start"]
