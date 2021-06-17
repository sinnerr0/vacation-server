FROM node:15-alpine

RUN apk update && apk add imagemagick ghostscript poppler-utils jq curl

RUN npm i -g pm2

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

ARG SESSION
ARG SERVICE_KEY
ENV SESSION=$SESSION
ENV SERVICE_KEY=$SERVICE_KEY

EXPOSE 3001

CMD pm2 start server.js cron.js && pm2 logs