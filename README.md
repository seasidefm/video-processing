## SeasideFM Video Processor

This is a TypeScript (Node.js) based microservice for processing video conversion jobs.

OBS will produce MKV files of streams, and the worker(s) convert these files to MP4
to facilitate stream compatibility across any platform.

### How to run
Use docker compose!

`docker-compose up`

I may provide manual instructions here later, but in general, you should setup a Redis cache and provide the expected 
env vars. Look at `docker-compose.yml` for those. Run producer and worker(s) using `yarn` scripts in `package.json`.

### How to deploy
Coming in the next few commits, will be with kubernetes.