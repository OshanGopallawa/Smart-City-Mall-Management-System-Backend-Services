FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S mallapi -u 1001 -G nodejs
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/src ./src
RUN chown -R mallapi:nodejs /app
USER mallapi
EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1
ENV NODE_ENV=production
CMD ["node", "src/server.js"]
