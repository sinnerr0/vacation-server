#!/bin/bash
docker stop vacation-server
docker container rm vacation-server

docker build -t vacation-server \
  --build-arg SERVICE_KEY=$SERVICE_KEY \
  --build-arg CHOI_USERNAME=$CHOI_USERNAME \
  --build-arg CHOI_PASSWORD=$CHOI_PASSWORD \
  --build-arg GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
  --build-arg GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
  --build-arg GOOGLE_TOKEN=$GOOGLE_TOKEN \
  --build-arg GOOGLE_CALENDAR_ID=$GOOGLE_CALENDAR_ID \
  .

docker run --name vacation-server --env PORT=80 -dp 80:80 vacation-server

echo "finished"
