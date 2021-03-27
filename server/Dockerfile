FROM node:15-alpine

RUN apk update && apk add imagemagick ghostscript poppler-utils

RUN npm i -g pm2

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["pm2", "start", "index.js"]