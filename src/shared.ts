import { CredentialsOptions } from "aws-sdk/lib/credentials";
import AWS from "aws-sdk";

export interface VideoJob {
  file: string;
  id: string;
}

export const getJobConfig = () => {
  const redisHost = process.env.REDIS_HOST;

  if (!redisHost) {
    throw new Error("Cannot find REDIS_HOST in env.");
  }

  return {
    redisUri: `redis://${redisHost}:6379`,
  };
};

interface StorageBucket {
  bucketName: string;
  config: CredentialsOptions &
    AWS.S3.ClientConfiguration & {
      endpoint: AWS.Endpoint | string;
      s3ForcePathStyle?: boolean;
      signatureVersion?: string;
    };
}

export const getStorageConfig = () => {
  const minioKey = process.env.MINIO_KEY,
    minioSecret = process.env.MINIO_SECRET,
    minioEndpoint = process.env.MINIO_ENDPOINT;

  if (!minioKey || !minioSecret || !minioEndpoint) {
    throw new Error("Cannot find MINIO env vars!");
  }

  const uploadBucket = process.env.UPLOAD_BUCKET,
    processedBucket = process.env.PROCESSED_BUCKET;

  if (!uploadBucket || !processedBucket) {
    throw new Error("Cannot find all bucket targets!");
  }

  const sharedConfig = {
    s3ForcePathStyle: true, // needed with minio?
    signatureVersion: "v4",
    region: "us-east-1",
    endpoint: new AWS.Endpoint(minioEndpoint),
    accessKeyId: minioKey,
    secretAccessKey: minioSecret,
  };

  const unprocessedUploadsBucket: StorageBucket = {
    bucketName: uploadBucket,
    config: sharedConfig,
  };

  const processedVideosBucket: StorageBucket = {
    bucketName: processedBucket,
    config: sharedConfig,
  };

  return {
    tempDir: "/app/temp",
    unprocessedUploadsBucket,
    processedVideosBucket,
  };
};
