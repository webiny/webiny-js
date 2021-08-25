import { Stream } from "stream";
import S3 from "aws-sdk/clients/s3";

const ARCHIVE_CONTENT_TYPE = "application/zip";

class S3StreamHandler {
    s3: S3;

    constructor() {
        this.s3 = new S3({ region: process.env.AWS_REGION });
    }

    readStream(Bucket: string, Key: string) {
        return this.s3.getObject({ Bucket, Key }).createReadStream();
    }

    writeStream(Bucket: string, Key: string) {
        const streamPassThrough = new Stream.PassThrough();

        const params: AWS.S3.PutObjectRequest = {
            ACL: "public-read",
            Body: streamPassThrough,
            Bucket,
            ContentType: ARCHIVE_CONTENT_TYPE,
            Key
        };

        return {
            s3StreamUpload: streamPassThrough,
            // TODO: Try using `FileManager` here
            uploaded: this.s3.upload(params, (error: Error): void => {
                if (error) {
                    console.error(
                        `Got error creating stream to s3 ${error.name} ${error.message} ${error.stack}`
                    );
                    throw error;
                }
            })
        };
    }
}

export const s3StreamHandler = new S3StreamHandler();
