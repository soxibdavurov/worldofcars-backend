# ---- 1-bosqich: build (TypeScript -> dist) ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- 2-bosqich: ishga tushirish (faqat kerakli narsalar) ----
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Repo'dagi mavjud rasmlar: volume birinchi marta ulanganda shu yerdan nusxa olinadi
COPY uploads ./uploads
RUN mkdir -p uploads/member uploads/property uploads/article uploads/car \
    && chown -R node:node /app
USER node
EXPOSE 3007
CMD ["node", "dist/apps/woc-api/main"]
