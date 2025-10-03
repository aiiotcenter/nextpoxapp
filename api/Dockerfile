# ---- Frontend build image ----
FROM node:18-slim AS build
WORKDIR /app

# System deps (Prisma engines/OpenSSL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl libssl3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# 1) Install deps from lockfile (reproducible builds)
COPY package.json package-lock.json ./
# Dev deps are needed to build Next.js
RUN npm ci

# 2) Copy ONLY prisma first, so generate can cache
COPY prisma ./prisma

# Provide a DATABASE_URL for prisma generate at build-time (dummy is fine if schema doesn't introspect DB)
ENV DATABASE_URL="mysql://root:fadifadi2025@mysql:3306/skinconditions"

# 3) Generate Prisma Client
RUN npx prisma generate

# 4) Copy the rest and build
COPY . .
ENV NODE_ENV=production
RUN npm run build

# After build, prune dev deps so runtime is lighter
RUN npm prune --omit=dev


# ---- Runtime image ----
FROM node:18-slim
WORKDIR /app

# Runtime system deps for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl libssl3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=7134
ENV DATABASE_URL="mysql://root:fadifadi2025@mysql:3306/skinconditions"

# Copy production node_modules (already pruned), prisma, build output, public assets, and pkg metadata
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

# (Optional) If you use Next standalone output, also copy:
# COPY --from=build /app/.next/standalone ./
# COPY --from=build /app/.next/static ./.next/static
# and then start with: CMD ["node", "server.js"]

EXPOSE 7134

# Ensure Next binds on all interfaces in the container
CMD ["npm", "run", "start", "--", "-p", "7134", "-H", "0.0.0.0"]