#!/bin/bash
docker stop vacation-server

docker build -t vacation-server \
  --build-arg PORT=80 \
  --build-arg SERVICE_KEY=$SERVICE_KEY \
  --build-arg CHOI_USERNAME=$CHOI_USERNAME \
  --build-arg CHOI_PASSWORD=$CHOI_PASSWORD \
  --build-arg GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
  --build-arg GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
  --build-arg GOOGLE_TOKEN=$GOOGLE_TOKEN \
  --build-arg GOOGLE_CALENDAR_ID=$GOOGLE_CALENDAR_ID \
  .

docker run --name vacation-server --rm -dp 3001:3001 vacation-server

echo "finished"
