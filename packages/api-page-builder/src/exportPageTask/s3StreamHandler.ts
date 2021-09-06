import { Stream, PassThrough } from "stream";
import S3 from "aws-sdk/clients/s3";

const ARCHIVE_CONTENT_TYPE = "application/zip";

class S3StreamHandler {
    s3: S3;
    bucket: string;

    constructor() {
        this.s3 = new S3({ region: process.env.AWS_REGION });
        this.bucket = process.env.S3_BUCKET;
    }

    /**
     * We're checking if the file is accessible on S3 by getting object meta data.
     * It help us to filter files that we need to download as part of export data.
     * @param Key {string}
     */
    async isFileAccessible(Key: string): Promise<boolean> {
        try {
            await this.s3.headObject({ Bucket: this.bucket, Key }).promise();
            return true;
        } catch (error) {
            console.warn(`Error while fetching meta data for file "${Key}"`);
            console.log(error);
            return false;
        }
    }

    readStream(Key: string) {
        return this.s3.getObject({ Bucket: this.bucket, Key }).createReadStream();
    }

    writeStream(Key: string): {
        streamPassThrough: PassThrough;
        streamPassThroughUploadPromise: Promise<S3.ManagedUpload.SendData>;
    } {
        const streamPassThrough = new Stream.PassThrough();

        const params: S3.PutObjectRequest = {
            ACL: "public-read",
            Body: streamPassThrough,
            Bucket: this.bucket,
            ContentType: ARCHIVE_CONTENT_TYPE,
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
}

export const s3StreamHandler = new S3StreamHandler();
