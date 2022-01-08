FROM node:15-alpine

RUN apk update && apk add imagemagick ghostscript poppler-utils jq curl gettext nginx chromium bash && mkdir -p /run/nginx

RUN npm i -g pm2

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production
COPY . .

ARG PORT
ARG SERVICE_KEY
ARG CHOI_USERNAME
ARG CHOI_PASSWORD
ENV PORT=$PORT
ENV SERVICE_KEY=$SERVICE_KEY
ENV CHOI_USERNAME=$CHOI_USERNAME
ENV CHOI_PASSWORD=$CHOI_PASSWORD
ENV DOLLAR='$'

COPY nginx.conf /etc/nginx/nginx.conf

CMD env && envsubst < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf && cat /etc/nginx/nginx.conf && nginx && pm2 start server.js cron.js && pm2 logs