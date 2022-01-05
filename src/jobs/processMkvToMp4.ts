import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import { ProcessCallbackFunction } from "bull";
import { getJobConfig, getStorageConfig, VideoJob } from "../shared";
import AWS from "aws-sdk";

const storageConfig = getStorageConfig();

const unprocessedBucket = new AWS.S3(
  storageConfig.unprocessedUploadsBucket.config
);
const processedBucket = new AWS.S3(storageConfig.processedVideosBucket.config);

export const mkvToMp4Job: ProcessCallbackFunction<VideoJob> = async (
  job,
  done
) => {
  console.log("Processing file: ", job.data.id);

  try {
    const fileName = `${job.data.id}.mkv`;

    const file = unprocessedBucket.getObject({
      Bucket: storageConfig.unprocessedUploadsBucket.bucketName,
      Key: fileName,
    });

    // Get a stream from the S3 bucket
    console.log("Creating a read stream...");
    const readStream = file.createReadStream();

    // We need to send all of the output to S3
    const ffmpegOutputFile = `${storageConfig.tempDir}/${job.data.id}.mp4`;

    // Process the file, wrapped in Promise for awaiting purposes
    await new Promise<void>((resolve, reject) => {
      ffmpeg(readStream, { logger: console, stdoutLines: 15 })
        .addOption(["-codec", "copy"])
        .outputFormat("mp4")
        .on("start", (startCommand) => {
          console.log("Starting ffmpeg process with: ", startCommand);
        })
        .on("end", () => {
          console.log("FFMPEG finished processing!");
          resolve();
        })
        .on("progress", (p) => console.log("progress:", p))
        // .on('stderr', function(stderrLine) {
        //     console.log(stderrLine);
        // })
        .on("error", (err) => {
          console.log("error!", err);
          reject(err);
        })
        .save(ffmpegOutputFile);
    });

    // Consume the newly created file
    const mp4FileStream = fs.createReadStream(ffmpegOutputFile);
    const bucketStreamParams = {
      Bucket: storageConfig.processedVideosBucket.bucketName,
      Key: `${job.data.id}.mp4`,
      Body: mp4FileStream,
    };
    console.log("Piping ffmpeg data to s3...");
    const s3Response = await processedBucket
      .upload(bucketStreamParams)
      .promise();
    console.log("Cleaning up...");

    mp4FileStream.destroy();
    readStream.destroy();

    fs.rmSync(ffmpegOutputFile);

    console.log("Done. Job complete!");
    done(null, { response: s3Response });
  } catch (e) {
    console.error(e);
    done(e as Error);
  }
};
