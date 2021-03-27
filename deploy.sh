#!/bin/bash
docker stop vacation-server
docker stop vacation-cron

docker build -t vacation-server ./server
docker run --name vacation-server --rm -v /home/ubuntu/www:/app/www -dp 3001:3001 vacation-server

docker build -t vacation-cron \
  --build-arg SESSION=$SESSION \
  --build-arg SERVICE_KEY=$SERVICE_KEY \
  ./cron
docker run --name vacation-cron --rm -d -v /home/ubuntu/www:/app/www vacation-cron
