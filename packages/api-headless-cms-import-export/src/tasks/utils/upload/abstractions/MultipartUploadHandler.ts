import type {
    AbortMultipartUploadCommandOutput,
    CompleteMultipartUploadCommandOutput,
    S3Client
} from "@webiny/aws-sdk/client-s3";

export type ITag = string;

export interface IPart {
    tag: ITag;
    partNumber: number;
}

export type IMultipartUploadHandlerParamsMinBufferSize = number | `${number}MB`;

export interface IMultipartUploadHandlerParams {
    uploadId: string;
    client: S3Client;
    bucket: string;
    filename: string;
    parts: IPart[] | undefined;
    minBufferSize?: IMultipartUploadHandlerParamsMinBufferSize;
}

export interface IMultipartUploadHandlerAddParams {
    bufferLength: number;
    body: Buffer;
}

export interface IMultipartUploadHandlerPauseResult {
    uploadId: string;
    parts: IPart[];
}

export interface IMultipartUploadHandlerAddResult {
    parts: IPart[];
    canBePaused(): boolean;
    pause(): Promise<IMultipartUploadHandlerPauseResult>;
}

export interface IMultipartUploadHandlerCompleteResult {
    result: CompleteMultipartUploadCommandOutput;
    uploadId: string;
    parts: IPart[];
}

export interface IMultipartUploadHandlerAbortResult {
    result: AbortMultipartUploadCommandOutput;
    uploadId: string;
    parts: IPart[];
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
    getUploadId(): string;
}

export interface ICreateMultipartUploadHandler {
    (params: IMultipartUploadHandlerParams): IMultipartUploadHandler;
}
