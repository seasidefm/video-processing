import {CredentialsOptions} from "aws-sdk/lib/credentials";

export interface VideoJob {
    file: string;
    id: string;
}

export const getJobConfig = () => {
    const redisHost = process.env.REDIS_HOST

    if (!redisHost) {
        throw new Error('Cannot find REDIS_HOST in env.')
    }

    return {
        redisUri: `redis://${redisHost}:6379`
    }
}

interface StorageBucket {
    bucketName: string;
    config: {
        endpoint: string;
        credentials: CredentialsOptions;
    };
}

export const getStorageConfig = () => {
    const key = process.env.LINODE_S3_KEY,
        secret = process.env.LINODE_S3_SECRET,
        endpoint = process.env.LINODE_S3_ENDPOINT,
        uploadBucket = process.env.LINODE_S3_UPLOAD_BUCKET,
        processedBucket = process.env.LINODE_S3_PROCESSED_BUCKET;

    if (!uploadBucket || !processedBucket || !key || !secret || !endpoint) {
        throw new Error("Cannot find all expected LINODE_S3_* env vars!");
    }

    const unprocessedUploadsBucket: StorageBucket = {
        bucketName: uploadBucket,
        config: {
            endpoint: endpoint,
            credentials: {
                accessKeyId: key,
                secretAccessKey: secret,
            },
        },
    };

    const processedVideosBucket: StorageBucket = {
        bucketName: processedBucket,
        config: {
            endpoint: endpoint,
            credentials: {
                accessKeyId: key,
                secretAccessKey: secret,
            },
        },
    };

    return {
        unprocessedUploadsBucket,
        processedVideosBucket
    };
};