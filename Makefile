
install:
	yarn

dev: install
	yarn dev

ready:
    docker run --rm --privileged linuxkit/binfmt:v0.8

build-arm: ready
	docker buildx build --platform linux/arm64 --push \
		-t registry.dougflynn.dev/video-intake \
		-f docker/Dockerfile.publisher \
		.
	docker buildx build --platform linux/arm64 --push \
		-t registry.dougflynn.dev/video-worker \
		-f docker/Dockerfile.worker \
		.