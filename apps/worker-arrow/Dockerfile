FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY apps/worker-arrow/ apps/worker-arrow/

RUN npm install --workspaces --if-present --legacy-peer-deps

RUN cd packages/shared-types && npx tsc || true
RUN cd packages/shared-utils && npx tsc || true
RUN cd packages/core-aura && npx tsc || true
RUN cd packages/core-arrow && npx tsc || true
RUN cd packages/core-modules && npx tsc || true
RUN cd packages/core-osai && npx tsc || true

RUN cd apps/worker-arrow && npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker-arrow/dist ./apps/worker-arrow/dist
COPY apps/worker-arrow/package.json ./apps/worker-arrow/package.json

CMD ["node", "apps/worker-arrow/dist/index.js"]
