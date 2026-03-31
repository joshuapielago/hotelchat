FROM node:22-alpine AS base

WORKDIR /app

COPY ely-admin/package.json ./
RUN npm install

COPY ely-admin/ .

# Copy shared Prisma schema from ely-service
COPY ely-service/prisma ./prisma
RUN npx prisma generate

RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

EXPOSE 3200

ENV PORT=3200
CMD ["node", "server.js"]
