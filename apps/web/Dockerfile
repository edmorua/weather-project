FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
RUN npm install --workspaces --include-workspace-root
COPY apps/web ./apps/web
ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build --workspace apps/web

FROM nginx:1.27-alpine AS runner
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
