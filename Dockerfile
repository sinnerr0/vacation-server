FROM node:15-alpine

RUN apk update && apk add imagemagick ghostscript poppler-utils jq curl gettext nginx && mkdir -p /run/nginx

RUN npm i -g pm2

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production
COPY . .

ARG PORT
ARG SESSION
ARG SERVICE_KEY
ENV PORT=$PORT
ENV SESSION=$SESSION
ENV SERVICE_KEY=$SERVICE_KEY
ENV DOLLAR='$'

COPY nginx.conf /etc/nginx/nginx.conf

CMD env && envsubst < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf && cat /etc/nginx/nginx.conf && nginx && pm2 start server.js cron.js && pm2 logs