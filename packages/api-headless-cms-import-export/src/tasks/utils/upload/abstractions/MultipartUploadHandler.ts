import {
    AbortMultipartUploadCommandOutput,
    CompleteMultipartUploadCommandOutput,
    S3Client
} from "@webiny/aws-sdk/client-s3";
import { NonEmptyArray } from "@webiny/api/types";

export type ITag = string;

export type IMultipartUploadHandlerParamsMinBufferSize = number | `${number}MB`;

export interface IMultipartUploadHandlerParams {
    uploadId: string;
    client: S3Client;
    bucket: string;
    filename: string;
    tags?: NonEmptyArray<ITag>;
    part?: number;
    minBufferSize?: IMultipartUploadHandlerParamsMinBufferSize;
}

export interface IMultipartUploadHandlerAddParams {
    part: number;
    bufferLength: number;
    body: Buffer;
}

export interface IMultipartUploadHandlerPauseResult {
    nextPart: number;
    uploadId: string;
    tags: NonEmptyArray<ITag>;
}

export interface IMultipartUploadHandlerAddResult {
    nextPart: number;
    canBePaused(): boolean;
    pause(): Promise<IMultipartUploadHandlerPauseResult>;
}

export interface IMultipartUploadHandlerCompleteResult {
    result: CompleteMultipartUploadCommandOutput;
    uploadId: string;
    tags: NonEmptyArray<ITag>;
}

export interface IMultipartUploadHandlerAbortResult {
    result: AbortMultipartUploadCommandOutput;
    uploadId: string;
    tags: ITag[];
}

export interface IMultipartUploadHandlerGetBufferResult {
    buffer: Buffer[];
    bufferLength: number;
}

export interface IMultipartUploadHandler {
    add(buffer: Buffer): Promise<IMultipartUploadHandlerAddResult>;
    complete(): Promise<IMultipartUploadHandlerCompleteResult>;
    abort(): Promise<IMultipartUploadHandlerAbortResult>;
    getBuffer(): IMultipartUploadHandlerGetBufferResult;
    getNextPart(): number;
    getUploadId(): string;
    getTags(): NonEmptyArray<ITag>;
}

export interface ICreateMultipartUploadHandler {
    (params: IMultipartUploadHandlerParams): IMultipartUploadHandler;
}
