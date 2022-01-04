import express from "express";
import Queue from "bull";
import { getJobConfig } from "./shared";

const app = express();

const config = getJobConfig();

console.log("📼 Starting SeasideFM job broker...");

console.log("Setting up Bull...");
const videoQueue = new Queue("video transcoding", config.redisUri);
console.log("Bull queue created!");

app.get("/", (req, res) => {
  console.log(`Creating job for: ${req.query.id}`);
  videoQueue.add({
    // This will be generated as part of a storage transaction
    // and sent here
    id: req.query.id,
  });
  res.send("Job created!");
});

app.listen(Number(process.env.WEB_PORT || 5000), "0.0.0.0", () => {
  console.log("Express server is running!");
});
