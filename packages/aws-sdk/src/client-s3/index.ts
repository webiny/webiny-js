import { S3, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { createCacheKey } from "@webiny/utils";

export {
    CompleteMultipartUploadCommand,
    CompleteMultipartUploadCommandOutput,
    AbortMultipartUploadCommandOutput,
    CompleteMultipartUploadOutput,
    DeleteObjectOutput,
    GetObjectCommand,
    GetObjectOutput,
    HeadObjectCommand,
    HeadObjectOutput,
    ListObjectsCommand,
    ListObjectsOutput,
    ListObjectsV2Command,
    ListPartsCommand,
    ListPartsCommandOutput,
    ListPartsOutput,
    ObjectCannedACL,
    Part,
    PutObjectCommand,
    PutObjectCommandInput,
    PutObjectCommandOutput,
    PutObjectRequest,
    S3,
    S3Client,
    UploadPartCommand,
    CreateMultipartUploadCommand
} from "@aws-sdk/client-s3";

export { createPresignedPost } from "@aws-sdk/s3-presigned-post";
export { PresignedPost, PresignedPostOptions } from "@aws-sdk/s3-presigned-post";

export { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3ClientsCache = new Map<string, S3Client>();

export const createS3Client = (initial?: S3ClientConfig): S3Client => {
    const options = {
        region: process.env.AWS_REGION,
        ...initial
    };
    const key = createCacheKey(options);
    if (s3ClientsCache.has(key)) {
        return s3ClientsCache.get(key) as S3Client;
    }

    const instance = new S3Client(options);
    s3ClientsCache.set(key, instance);
    return instance;
};

const s3Cache = new Map<string, S3>();

export const createS3 = (initial?: S3ClientConfig): S3 => {
    const options = {
        region: process.env.AWS_REGION,
        ...initial
    };
    const key = createCacheKey(options);
    if (s3Cache.has(key)) {
        return s3Cache.get(key) as S3;
    }

    const instance = new S3(options);

    s3Cache.set(key, instance);
    return instance;
};
