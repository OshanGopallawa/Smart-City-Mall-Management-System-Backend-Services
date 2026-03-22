FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S analytics -u 1001 -G nodejs
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/src ./src
RUN chown -R analytics:nodejs /app
USER analytics
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3004/health || exit 1
ENV NODE_ENV=production
CMD ["node", "src/server.js"]
