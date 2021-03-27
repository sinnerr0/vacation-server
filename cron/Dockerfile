FROM node:15-alpine

RUN apk update && apk add dcron jq curl

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

ARG SESSION
ARG SERVICE_KEY
ENV SESSION=$SESSION
ENV SERVICE_KEY=$SERVICE_KEY

RUN echo '0 * * * * sh /app/vacation.sh' >> /etc/crontabs/root && \
echo '0 * * * * sh /app/holiday.sh' >> /etc/crontabs/root

CMD ["/bin/sh","-c","crond -b -L /var/log/cron.log && tail -f /var/log/cron.log"]
