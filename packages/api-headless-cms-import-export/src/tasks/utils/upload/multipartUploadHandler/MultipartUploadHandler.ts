import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    S3Client,
    UploadPartCommand
} from "@webiny/aws-sdk/client-s3";
import { WebinyError } from "@webiny/error";
import bytes from "bytes";
import {
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
    ITag
} from "../abstractions/MultipartUploadHandler";
import { NonEmptyArray } from "@webiny/api/types";
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
    private readonly tags: ITag[] = [];

    private buffer: Buffer[] = [];
    private bufferLength = 0;
    private partNumber: number;

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
        this.tags = params.tags || [];
        this.partNumber = !params.part || params.part <= 0 ? 1 : params.part;
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
                nextPart: this.partNumber,
                written: false,
                pause: () => {
                    return this.pause();
                }
            });
        }
        const bufferLength = this.bufferLength;
        await this.write({
            body: Buffer.concat(this.buffer, this.bufferLength),
            bufferLength,
            part: this.partNumber
        });
        return createMultipartUploadHandlerAddResult({
            nextPart: this.partNumber,
            written: true,
            pause: () => {
                return this.pause();
            }
        });
    }

    public async complete(): Promise<IMultipartUploadHandlerCompleteResult> {
        await this.write({
            body: Buffer.concat(this.buffer, this.bufferLength),
            bufferLength: this.bufferLength,
            part: this.partNumber
        });

        if (this.tags.length === 0) {
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
                Parts: this.tags.map((tag, index) => {
                    return {
                        ETag: tag,
                        PartNumber: index + 1
                    };
                })
            }
        });
        const result = await this.client.send(cmd);

        return createMultipartUploadHandlerCompleteResult({
            result,
            uploadId: this.uploadId,
            tags: this.tags as NonEmptyArray<ITag>
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
            tags: this.tags
        });
    }

    private async pause(): Promise<IMultipartUploadHandlerPauseResult> {
        if (this.bufferLength > 0) {
            throw new WebinyError({
                message: `Failed to pause the upload, buffer was not empty.`,
                code: "S3_ERROR"
            });
        } else if (this.tags.length === 0) {
            throw new WebinyError({
                message: `Failed to pause the upload, no parts were uploaded.`,
                code: "S3_ERROR"
            });
        }

        return createMultipartUploadHandlerPauseResult({
            nextPart: this.partNumber,
            uploadId: this.uploadId,
            tags: this.tags as NonEmptyArray<ITag>
        });
    }

    private async write(params: IMultipartUploadHandlerAddParams): Promise<boolean> {
        if (params.bufferLength <= 0) {
            return false;
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
        this.tags.push(result.ETag.replaceAll('"', ""));
        // Reset the buffer and increase current part number.
        this.buffer = [];
        this.bufferLength = 0;
        this.partNumber++;
        return true;
    }

    public getUploadId(): string {
        return this.uploadId;
    }

    public getNextPart(): number {
        return this.partNumber;
    }

    public getTags(): NonEmptyArray<ITag> {
        return this.tags as NonEmptyArray<ITag>;
    }
}

export const createMultipartUpload: ICreateMultipartUploadHandler = params => {
    return new MultipartUploadHandler(params);
};
