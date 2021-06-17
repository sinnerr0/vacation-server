#!/bin/bash
docker stop vacation-server

docker build -t vacation-server \
  --build-arg SESSION=$SESSION \
  --build-arg SERVICE_KEY=$SERVICE_KEY \
  .

docker run --name vacation-server --rm -dp 3001:3001 vacation-server

echo "finished"
