import {
    AbortMultipartUploadCommandOutput,
    CompleteMultipartUploadCommandOutput,
    S3Client
} from "@webiny/aws-sdk/client-s3";

export interface IMultipartUploadParams {
    uploadId: string;
    client: S3Client;
    bucket: string;
    filename: string;
    part: number;
}

export interface IMultipartUploadAddParams {
    part: number;
    length: number;
    body: Buffer;
}

export interface IMultipartUploadAddResult {
    part: number;
}

export interface IMultipartUpload {
    add(buffer: Buffer): Promise<IMultipartUploadAddResult>;
    complete(): Promise<CompleteMultipartUploadCommandOutput>;
    abort(): Promise<AbortMultipartUploadCommandOutput>;
}

export interface ICreateMultipartUpload {
    (params: IMultipartUploadParams): IMultipartUpload;
}
