FROM node:20-alpine AS build
WORKDIR /build
COPY package*.json ./
RUN npm install --ignore-scripts
COPY . .
ARG VITE_ENGINE_WS_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
