FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
RUN npm ci --workspaces --include-workspace-root
COPY apps/api ./apps/api
RUN npm run build --workspace apps/api && \
    npm prune --omit=dev && \
    cp -rn /app/apps/api/node_modules/. /app/node_modules/

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
EXPOSE 3001
CMD ["node", "apps/api/dist/src/main.js"]
