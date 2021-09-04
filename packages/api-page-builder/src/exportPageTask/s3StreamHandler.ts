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
