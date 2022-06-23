FROM --platform=linux/amd64 node:15-alpine

RUN apk update && apk add jq curl gettext nginx chromium bash && mkdir -p /run/nginx

RUN npm i -g pm2

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production
COPY . .

ARG SERVICE_KEY
ENV SERVICE_KEY=$SERVICE_KEY
ARG CHOI_USERNAME
ENV CHOI_USERNAME=$CHOI_USERNAME
ARG CHOI_PASSWORD
ENV CHOI_PASSWORD=$CHOI_PASSWORD
ARG GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ARG GOOGLE_TOKEN
ENV GOOGLE_TOKEN=$GOOGLE_TOKEN
ARG GOOGLE_CALENDAR_ID
ENV GOOGLE_CALENDAR_ID=$GOOGLE_CALENDAR_ID

COPY nginx.conf nginx.conf
CMD env && set -e && envsubst '\$PORT' < nginx.conf > /etc/nginx/nginx.conf && cat /etc/nginx/nginx.conf && nginx -t && nginx && pm2 start server.js cron.js && pm2 logs
