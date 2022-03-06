#!/usr/bin/env bash
set -x
set -o errexit

echo "THIS SHOULD NOT BE USED IN PRODUCTION!!!"
echo "IT IS ONLY FOR LOCAL BUILDING OF THE PRODUCTION IMAGE"
echo "IT WILL BE REMOVED AT SOME POINT"

IMAGE_NAME="remote-signer-server"
PROJECT_ROOT=$(git rev-parse --show-toplevel)
IMAGE_VERSION=$(git rev-parse --short HEAD)

FULL_IMAGE_NAME="woss/$IMAGE_NAME:$IMAGE_VERSION "

docker build \
	--tag docker.io/$FULL_IMAGE_NAME \
	--file $PROJECT_ROOT/devops/prod/server.Dockerfile .

if [[ "${1}" =~ "run" ]]; then
	echo "$1"
	docker run --rm -it \
		--name $IMAGE_NAME \
		-v "$(pwd)"/keys:/workspace/keys \
		--env-file=$PROJECT_ROOT/.env \
		$FULL_IMAGE_NAME
fi
