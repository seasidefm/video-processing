import Queue from 'bull'
import AWS from 'aws-sdk'
import ffmpeg from 'fluent-ffmpeg'

import {getJobConfig, getStorageConfig, VideoJob} from "./shared";
import {PassThrough} from "stream";

const config = getJobConfig()
const storageConfig = getStorageConfig()

const videoQueue = Queue<VideoJob>('video transcoding', config.redisUri)

const unprocessedBucket = new AWS.S3(storageConfig.unprocessedUploadsBucket.config)
const processedBucket = new AWS.S3(storageConfig.processedVideosBucket.config)

console.log("Worker is ready!");

ffmpeg.getAvailableCodecs(function(err, codecs) {
    console.log('Available codecs:');
    console.dir(codecs['libx264']);
});

videoQueue.process(async (job, done) => {
    console.log('Processing file: ', job.data.file)

    try {
        const fileName = job.data.file

        const file = unprocessedBucket.getObject({
            Bucket: storageConfig.unprocessedUploadsBucket.bucketName,
            Key: fileName
        })

        // Get a stream from the S3 bucket
        console.log('Creating a read stream...')
        const readStream = file.createReadStream()

        // We need to send all of the output to S3
        const ffmpegOutputStream = new PassThrough()

        // Process the file, sending output to passthrough
        ffmpeg(readStream, {logger: console, stdoutLines: 15})
            .videoCodec('libx264')
            .audioCodec('libmp3lame')
            .addOption(['-c:a', 'aac'])
            // This option allows for fragmented MP4 files,
            // allowing piping/streaming to a desination as well
            .addOption(['-movflags', 'frag_keyframe+empty_moov'])
            .outputFormat('mp4')
            .on('start', (startCommand) => {
                console.log('Starting ffmpeg process with: ', startCommand)
            })
            .on('end', () => console.log('FFMPEG finished processing!'))
            .on('progress', (p) => console.log('progress:', p))
            // .on('stderr', function(stderrLine) {
            //     console.log(stderrLine);
            // })
            .on('error', (err) => {
                console.log('error!', err)
                done(err as Error)
            })
            .addOption(['-loglevel', 'debug'])
            .pipe(ffmpegOutputStream, { end: true })

        const bucketStreamParams = {
            Bucket: storageConfig.processedVideosBucket.bucketName,
            Key: `${job.data.id}.mp4`,
            Body: ffmpegOutputStream
        }

        console.log('Piping ffmpeg data to s3...')
        const s3Response = await processedBucket.upload(bucketStreamParams).promise()

        ffmpegOutputStream.destroy()
        readStream.destroy()

        done(null, { response: s3Response })
    }catch (e) {
        console.error(e)
        done(e as Error)
    }
})
