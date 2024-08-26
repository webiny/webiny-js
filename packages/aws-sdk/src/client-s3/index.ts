import { S3, S3ClientConfig } from "@aws-sdk/client-s3";
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
    UploadPartCommand
} from "@aws-sdk/client-s3";

export { createPresignedPost } from "@aws-sdk/s3-presigned-post";
export { PresignedPost, PresignedPostOptions } from "@aws-sdk/s3-presigned-post";

export { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const clients = new Map<string, S3>();

export const createS3Client = (initial?: S3ClientConfig): S3 => {
    const options = {
        region: process.env.AWS_REGION,
        ...initial
    };
    const key = createCacheKey(options);
    if (clients.has(key)) {
        return clients.get(key) as S3;
    }

    const instance = new S3(options);
    clients.set(key, instance);
    return instance;
};
