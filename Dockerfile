# Multi-stage Docker build for Blink CMS (Backend + Frontend unified production container)
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Build Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend ./frontend
RUN cd frontend && npm run build

# 2. Build Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend ./backend
RUN cd backend && npm run build

# Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/frontend/dist /frontend/dist
COPY backend/service-account.json* ./

EXPOSE 4000

CMD ["node", "dist/server.js"]
