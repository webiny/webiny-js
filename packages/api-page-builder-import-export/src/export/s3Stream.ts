import { Stream, Readable } from "stream";
import {
    S3,
    ListObjectsOutput,
    DeleteObjectOutput,
    HeadObjectOutput,
    getSignedUrl,
    GetObjectCommand,
    PutObjectCommand,
    PutObjectCommandInput
} from "@webiny/aws-sdk/client-s3";
import { Upload } from "@webiny/aws-sdk/lib-storage";

export type { ListObjectsOutput };

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

    getPresignedUrl(key?: string) {
        return getSignedUrl(
            this.s3,
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: key
            }),
            {
                expiresIn: 604800 // 1 week
            }
        );
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

    getObjectHead(Key: string): Promise<HeadObjectOutput> {
        return this.s3.headObject({ Bucket: this.bucket, Key });
    }

    async readStream(Key: string): Promise<Readable> {
        const response = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key }));
        return response.Body as Readable;
    }

    writeStream(Key: string, contentType: string = ARCHIVE_CONTENT_TYPE) {
        const streamPassThrough = new Stream.PassThrough();

        const params: PutObjectCommandInput = {
            ACL: "private",
            Body: streamPassThrough,
            Bucket: this.bucket,
            ContentType: contentType,
            Key
        };

        const upload = new Upload({
            client: this.s3,
            params
        });

        return {
            streamPassThrough: streamPassThrough,
            /**
             * We're not using the `FileManager` storage plugin here because it currently doesn't support streams.
             */
            streamPassThroughUploadPromise: upload.done()
        };
    }

    async upload(params: { Key: string; ContentType: string; Body: Buffer }): Promise<void> {
        await this.s3.send(
            new PutObjectCommand({
                ACL: "private",
                Bucket: this.bucket,
                ...params
            })
        );
    }

    listObject(prefix: string): Promise<ListObjectsOutput> {
        return this.s3.listObjects({
            Bucket: this.bucket,
            Prefix: prefix
        });
    }

    deleteObject(key: string): Promise<DeleteObjectOutput> {
        return this.s3.deleteObject({ Key: key, Bucket: this.bucket });
    }
}

export const s3Stream = new S3Stream();
