import type { S3Client } from "@webiny/aws-sdk/client-s3";
import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    UploadPartCommand
} from "@webiny/aws-sdk/client-s3";
import { WebinyError } from "@webiny/error";
import bytes from "bytes";
import type {
    ICreateMultipartUploadHandler,
    IMultipartUploadHandler,
    IMultipartUploadHandlerAbortResult,
    IMultipartUploadHandlerAddParams,
    IMultipartUploadHandlerAddResult,
    IMultipartUploadHandlerCompleteResult,
    IMultipartUploadHandlerGetBufferResult,
    IMultipartUploadHandlerParams,
    IMultipartUploadHandlerParamsMinBufferSize,
    IMultipartUploadHandlerPauseResult,
    IPart
} from "../abstractions/MultipartUploadHandler";
import { createMultipartUploadHandlerPauseResult } from "./MultipartUploadHandlerPauseResult";
import { createMultipartUploadHandlerAbortResult } from "./MultipartUploadHandlerAbortResult";
import { createMultipartUploadHandlerCompleteResult } from "./MultipartUploadHandlerCompleteResult";
import { createMultipartUploadHandlerAddResult } from "./MultipartUploadHandlerAddResult";

/**
 * Minimum we can send into the S3 is 5MB.
 * We can modify to have this value bigger if required.
 */
const MIN_BUFFER_SIZE = bytes.parse("5MB");

const getMinBufferSize = (minBufferSize?: IMultipartUploadHandlerParamsMinBufferSize): number => {
    if (!minBufferSize) {
        return MIN_BUFFER_SIZE;
    }
    const size = typeof minBufferSize === "number" ? minBufferSize : bytes.parse(minBufferSize);
    if (size >= MIN_BUFFER_SIZE) {
        return size;
    }
    return MIN_BUFFER_SIZE;
};

export class MultipartUploadHandler implements IMultipartUploadHandler {
    private readonly uploadId: string;
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly filename: string;
    private readonly minBufferSize: IMultipartUploadHandlerParamsMinBufferSize;
    private readonly parts: IPart[];

    private buffer: Buffer[] = [];
    private bufferLength = 0;

    public constructor(params: IMultipartUploadHandlerParams) {
        if (!params.uploadId?.length) {
            throw new WebinyError({
                message: `Missing "uploadId" in the multipart upload handler.`,
                code: "MULTIPART_UPLOAD_ERROR"
            });
        } else if (!params.filename?.length) {
            throw new WebinyError({
                message: `Missing "filename" in the multipart upload handler.`,
                code: "MULTIPART_UPLOAD_ERROR"
            });
        }
        this.uploadId = params.uploadId;
        this.client = params.client;
        this.bucket = params.bucket;
        this.filename = params.filename;
        this.parts = params.parts || [];
        this.minBufferSize = getMinBufferSize(params.minBufferSize);
    }

    public getBuffer(): IMultipartUploadHandlerGetBufferResult {
        return {
            buffer: this.buffer,
            bufferLength: this.bufferLength
        };
    }

    public async add(buffer: Buffer): Promise<IMultipartUploadHandlerAddResult> {
        this.buffer.push(buffer);
        this.bufferLength = this.bufferLength + buffer.length;
        if (this.bufferLength < this.minBufferSize) {
            return createMultipartUploadHandlerAddResult({
                parts: this.parts,
                written: false,
                pause: () => {
                    return this.pause();
                }
            });
        }
        const bufferLength = this.bufferLength;

        const body = Buffer.concat(this.buffer, bufferLength);
        this.buffer = [];
        this.bufferLength = 0;
        await this.write({
            body,
            bufferLength
        });

        return createMultipartUploadHandlerAddResult({
            parts: this.parts,
            written: true,
            pause: () => {
                return this.pause();
            }
        });
    }

    public async complete(): Promise<IMultipartUploadHandlerCompleteResult> {
        const bufferLength = this.bufferLength;
        const body = Buffer.concat(this.buffer, bufferLength);
        this.buffer = [];
        this.bufferLength = 0;

        await this.write({
            body,
            bufferLength
        });

        if (this.parts.length === 0) {
            throw new WebinyError({
                message: `Failed to complete the upload, no parts were uploaded.`,
                code: "S3_ERROR"
            });
        }

        const cmd = new CompleteMultipartUploadCommand({
            UploadId: this.uploadId,
            Bucket: this.bucket,
            Key: this.filename,
            MultipartUpload: {
                Parts: this.parts.map(part => {
                    return {
                        ETag: part.tag,
                        PartNumber: part.partNumber
                    };
                })
            }
        });
        const result = await this.client.send(cmd);

        return createMultipartUploadHandlerCompleteResult({
            result,
            uploadId: this.uploadId,
            parts: this.parts
        });
    }

    public async abort(): Promise<IMultipartUploadHandlerAbortResult> {
        const cmd = new AbortMultipartUploadCommand({
            UploadId: this.uploadId,
            Bucket: this.bucket,
            Key: this.filename
        });
        const result = await this.client.send(cmd);
        return createMultipartUploadHandlerAbortResult({
            result,
            uploadId: this.uploadId,
            parts: this.parts
        });
    }

    private async pause(): Promise<IMultipartUploadHandlerPauseResult> {
        if (this.bufferLength > 0) {
            throw new WebinyError({
                message: `Failed to pause the upload, buffer was not empty.`,
                code: "S3_ERROR"
            });
        } else if (this.parts.length === 0) {
            throw new WebinyError({
                message: `Failed to pause the upload, no parts were uploaded.`,
                code: "S3_ERROR"
            });
        }

        return createMultipartUploadHandlerPauseResult({
            uploadId: this.uploadId,
            parts: this.parts
        });
    }

    private async write(params: IMultipartUploadHandlerAddParams): Promise<boolean> {
        if (params.bufferLength <= 0) {
            return false;
        }

        const nextPart = this.getNextPartNumber();
        const cmd = new UploadPartCommand({
            Bucket: this.bucket,
            Key: this.filename,
            UploadId: this.uploadId,
            Body: params.body,
            PartNumber: nextPart
        });
        const result = await this.client.send(cmd);
        if (!result.ETag) {
            throw new WebinyError({
                message: `Failed to upload part: ${nextPart}`,
                code: "S3_ERROR"
            });
        }
        this.parts.push({
            partNumber: nextPart,
            tag: result.ETag.replaceAll('"', "")
        });
        return true;
    }

    public getUploadId(): string {
        return this.uploadId;
    }

    public getNextPartNumber(): number {
        if (this.parts.length === 0) {
            return 1;
        }
        const part = this.parts.at(-1);
        if (!part) {
            return 1;
        }
        return part.partNumber + 1;
    }
}

export const createMultipartUpload: ICreateMultipartUploadHandler = params => {
    return new MultipartUploadHandler(params);
};
