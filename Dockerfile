FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
\n\
  location /api/ {\n\
    resolver 127.0.0.11 ipv6=off valid=10s;\n\
    proxy_pass http://threadline-backend:3001/;\n\
    proxy_http_version 1.1;\n\
    proxy_set_header Host $http_host;\n\
    proxy_set_header X-Real-IP $remote_addr;\n\
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
    proxy_set_header X-Forwarded-Proto $scheme;\n\
    proxy_read_timeout 30;\n\
  }\n\
\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n\
' > /etc/nginx/conf.d/default.conf

EXPOSE 80
