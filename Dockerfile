# Stage 1: Build Angular project
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve static files with Node.js serve (không cần Nginx)
FROM node:20-alpine

WORKDIR /app

# Cài đặt công cụ serve nhẹ của Node.js
RUN npm install -g serve

# Copy sản phẩm đã build sang
COPY --from=build /app/dist/fontend-do-an/browser ./dist

EXPOSE 4200

# Chạy server đơn giản trên cổng 4200 (-s giúp F5 không bị lỗi 404)
CMD ["serve", "-s", "dist", "-l", "4200"]
