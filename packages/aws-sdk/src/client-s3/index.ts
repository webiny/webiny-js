import { S3, S3Client, S3ClientConfig as BaseS3ClientConfig } from "@aws-sdk/client-s3";
import { createCacheKey } from "@webiny/utils";

export {
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsCommand,
    ListObjectsV2Command,
    ListPartsCommand,
    ObjectCannedACL,
    Part,
    DeleteObjectCommand,
    PutObjectCommand,
    PutObjectCommandInput,
    PutObjectRequest,
    UploadPartCommand,
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    S3,
    S3Client
} from "@aws-sdk/client-s3";

export type {
    CompleteMultipartUploadCommandOutput,
    AbortMultipartUploadCommandOutput,
    CompleteMultipartUploadOutput,
    DeleteObjectOutput,
    GetObjectOutput,
    GetObjectCommandOutput,
    HeadObjectOutput,
    HeadObjectCommandOutput,
    DeleteObjectCommandOutput,
    ListObjectsOutput,
    ListPartsCommandOutput,
    ListPartsOutput,
    PutObjectCommandOutput,
    UploadPartCommandOutput
} from "@aws-sdk/client-s3";

export { createPresignedPost } from "@aws-sdk/s3-presigned-post";
export { PresignedPost, PresignedPostOptions } from "@aws-sdk/s3-presigned-post";

export { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3ClientsCache = new Map<string, S3Client>();

export interface S3ClientConfig extends BaseS3ClientConfig {
    cache?: boolean;
}

export const createS3Client = (initial?: S3ClientConfig): S3Client => {
    const options: S3ClientConfig = {
        region: process.env.AWS_REGION,
        ...initial
    };
    const skipCache = options.cache === false;
    delete options.cache;
    if (skipCache) {
        return new S3Client({
            ...options
        });
    }

    const key = createCacheKey(options);
    if (s3ClientsCache.has(key)) {
        return s3ClientsCache.get(key) as S3Client;
    }

    const instance = new S3Client({
        ...options
    });
    s3ClientsCache.set(key, instance);

    return instance;
};

const s3Cache = new Map<string, S3>();

export const createS3 = (initial?: S3ClientConfig): S3 => {
    const options: S3ClientConfig = {
        region: process.env.AWS_REGION,
        ...initial
    };
    const skipCache = options.cache === false;
    delete options.cache;
    if (skipCache) {
        return new S3(options);
    }
    const key = createCacheKey(options);
    if (s3Cache.has(key)) {
        return s3Cache.get(key) as S3;
    }

    const instance = new S3(options);

    s3Cache.set(key, instance);
    return instance;
};
