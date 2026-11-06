# Stage 1: Build the React + Vite frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY students-hub-frontend/package*.json ./
RUN npm ci || npm install
COPY students-hub-frontend/ ./
RUN npm run build

# Stage 2: Production Node.js Server
FROM node:20-alpine
WORKDIR /app

# Install backend dependencies
COPY students-hub-backend/package*.json ./students-hub-backend/
RUN cd students-hub-backend && npm ci --omit=dev || npm install --omit=dev

# Copy backend source
COPY students-hub-backend/ ./students-hub-backend/

# Copy built frontend assets from stage 1
COPY --from=frontend-builder /app/frontend/dist ./students-hub-frontend/dist

WORKDIR /app/students-hub-backend
ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]

