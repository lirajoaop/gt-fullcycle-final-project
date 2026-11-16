# Stage 1: install all dependencies and compile TypeScript to dist/
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: runtime image with production dependencies and compiled code only
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# The official node image ships a non-root "node" user
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
