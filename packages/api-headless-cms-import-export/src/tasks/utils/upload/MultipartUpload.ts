import {
    AbortMultipartUploadCommand,
    AbortMultipartUploadCommandOutput,
    CompleteMultipartUploadCommand,
    CompleteMultipartUploadCommandOutput,
    S3Client,
    UploadPartCommand
} from "@webiny/aws-sdk/client-s3";
import { WebinyError } from "@webiny/error";
import bytes from "bytes";
import {
    ICreateMultipartUpload,
    IMultipartUpload,
    IMultipartUploadAddParams,
    IMultipartUploadAddResult,
    IMultipartUploadParams
} from "./abstractions/MultipartUpload";

interface ITag {
    tag: string;
    part: number;
}

/**
 * Minimum we can send into the S3 is 5MB.
 * We can modify to have this value bigger if required.
 */
const MIN_BUFFER_SIZE = bytes.parse("5MB");

export class MultipartUpload implements IMultipartUpload {
    private readonly uploadId: string;
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly filename: string;

    private buffer: Buffer[] = [];
    private bufferLength: number = 0;
    private partNumber: number;

    private readonly tags: ITag[] = [];

    public constructor(params: IMultipartUploadParams) {
        this.uploadId = params.uploadId;
        this.client = params.client;
        this.bucket = params.bucket;
        this.filename = params.filename;
        this.partNumber = params.part || 1;
    }

    public async add(buffer: Buffer): Promise<IMultipartUploadAddResult> {
        this.buffer.push(buffer);
        this.bufferLength = this.bufferLength + buffer.length;
        if (this.bufferLength < MIN_BUFFER_SIZE) {
            return {
                part: this.partNumber
            };
        }
        await this.write({
            body: Buffer.concat(this.buffer, this.bufferLength),
            length: this.bufferLength,
            part: this.partNumber
        });
        return {
            part: this.partNumber
        };
    }

    public async complete(): Promise<CompleteMultipartUploadCommandOutput> {
        await this.write({
            body: Buffer.concat(this.buffer, this.bufferLength),
            length: this.bufferLength,
            part: this.partNumber
        });

        const cmd = new CompleteMultipartUploadCommand({
            UploadId: this.uploadId,
            Bucket: this.bucket,
            Key: this.filename
        });
        return await this.client.send(cmd);
    }

    public async abort(): Promise<AbortMultipartUploadCommandOutput> {
        const cmd = new AbortMultipartUploadCommand({
            UploadId: this.uploadId,
            Bucket: this.bucket,
            Key: this.filename
        });
        return await this.client.send(cmd);
    }

    private async write(params: IMultipartUploadAddParams): Promise<void> {
        if (params.length <= 0) {
            return;
        }
        const cmd = new UploadPartCommand({
            Bucket: this.bucket,
            Key: this.filename,
            UploadId: this.uploadId,
            Body: params.body,
            PartNumber: params.part
        });
        const result = await this.client.send(cmd);
        if (!result.ETag) {
            throw new WebinyError({
                message: `Failed to upload part: ${params.part}`,
                code: "S3_ERROR"
            });
        }
        this.tags.push({
            tag: result.ETag,
            part: params.part
        });
        // Reset the buffer and increase current part number.
        this.buffer = [];
        this.bufferLength = 0;
        this.partNumber++;
    }
}

export const createMultipartUpload: ICreateMultipartUpload = params => {
    return new MultipartUpload(params);
};
