import Queue from "bull";

import { getJobConfig, VideoJob } from "./shared";
import { mkvToMp4Job } from "./jobs/processMkvToMp4";

const config = getJobConfig();

const videoQueue = Queue<VideoJob>("video transcoding", config.redisUri);

console.log("Worker is ready!");

videoQueue.process(mkvToMp4Job);
