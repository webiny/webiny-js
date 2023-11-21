import { Stream, Readable } from "stream";
import S3 from "aws-sdk/clients/s3";

const ARCHIVE_CONTENT_TYPE = "application/zip";

class S3Stream {
    s3: S3;
    bucket: string;

    constructor() {
        this.s3 = new S3({
            region: process.env.AWS_REGION as string
        });
        this.bucket = process.env.S3_BUCKET as string;
    }

    getPresignedUrl(key: string) {
        return this.s3.getSignedUrl("getObject", {
            Bucket: this.bucket,
            Key: key,
            Expires: 604800 // 1 week
        });
    }

    /**
     * We're checking if the file is accessible on S3 by getting object meta data.
     * It help us to filter files that we need to download as part of export data.
     * @param Key {string}
     */
    async isFileAccessible(Key: string): Promise<boolean> {
        try {
            await this.getObjectHead(Key);
            return true;
        } catch (error) {
            console.warn(`Error while fetching meta data for file "${Key}"`);
            console.log(error);
            return false;
        }
    }

    getObjectHead(Key: string): Promise<S3.HeadObjectOutput> {
        return this.s3.headObject({ Bucket: this.bucket, Key }).promise();
    }

    readStream(Key: string): Readable {
        return this.s3.getObject({ Bucket: this.bucket, Key }).createReadStream();
    }

    writeStream(Key: string, contentType: string = ARCHIVE_CONTENT_TYPE) {
        const streamPassThrough = new Stream.PassThrough();

        const params: S3.PutObjectRequest = {
            ACL: "private",
            Body: streamPassThrough,
            Bucket: this.bucket,
            ContentType: contentType,
            Key
        };

        return {
            streamPassThrough: streamPassThrough,
            /**
             * We're not using the `FileManager` storage plugin here because it currently doesn't support streams.
             */
            streamPassThroughUploadPromise: this.s3.upload(params).promise()
        };
    }

    upload(params: {
        Key: string;
        ContentType: string;
        Body: Buffer;
    }): Promise<S3.ManagedUpload.SendData> {
        return this.s3
            .upload({
                ACL: "private",
                Bucket: this.bucket,
                ...params
            })
            .promise();
    }

    listObject(prefix: string): Promise<S3.ListObjectsOutput> {
        return this.s3
            .listObjects({
                Bucket: this.bucket,
                Prefix: prefix
            })
            .promise();
    }

    deleteObject(key: string): Promise<S3.DeleteObjectOutput> {
        return this.s3.deleteObject({ Key: key, Bucket: this.bucket }).promise();
    }
}

export const s3Stream = new S3Stream();
