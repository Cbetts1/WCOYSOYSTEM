FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace files
COPY package.json ./
COPY tsconfig.base.json ./

# Copy all packages and apps
COPY packages/ packages/
COPY apps/backend-api/ apps/backend-api/

# Install all dependencies (workspace install)
RUN npm install --workspaces --if-present --legacy-peer-deps

# Build shared packages first
RUN cd packages/shared-types && npx tsc || true
RUN cd packages/shared-utils && npx tsc || true
RUN cd packages/core-aura && npx tsc || true
RUN cd packages/core-aios && npx tsc || true
RUN cd packages/core-aim && npx tsc || true
RUN cd packages/core-modules && npx tsc || true

# Build backend-api
RUN cd apps/backend-api && npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend-api/dist ./apps/backend-api/dist
COPY apps/backend-api/package.json ./apps/backend-api/package.json

EXPOSE 4000
CMD ["node", "apps/backend-api/dist/index.js"]
