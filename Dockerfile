FROM node:20-alpine AS build
WORKDIR /build
COPY package*.json ./
RUN npm install --ignore-scripts
COPY . .
ARG VITE_ENGINE_WS_URL
RUN npm run build

FROM node:20-alpine
RUN npm install -g serve
COPY --from=build /build/dist /app
EXPOSE 3000
CMD ["/bin/sh", "-c", "serve -s /app -l tcp://0.0.0.0:${PORT:-3000}"]
