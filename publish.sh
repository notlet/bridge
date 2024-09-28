#! /bin/bash

docker image build -t ghcr.io/notlet/bridge:latest .
docker push ghcr.io/notlet/bridge:latest

echo 👍