FROM node:20-alpine AS build
WORKDIR /build
COPY package*.json ./
RUN npm install --ignore-scripts
COPY . .
ARG VITE_ENGINE_WS_URL
ARG VITE_BOT_API_URL
ENV VITE_ENGINE_WS_URL=$VITE_ENGINE_WS_URL
ENV VITE_BOT_API_URL=$VITE_BOT_API_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /build/dist ./dist
COPY server.js .
CMD ["node", "server.js"]
