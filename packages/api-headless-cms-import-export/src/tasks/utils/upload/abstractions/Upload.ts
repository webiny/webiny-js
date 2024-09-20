import type { PassThrough } from "stream";
import type { CompleteMultipartUploadCommandOutput, S3Client } from "@webiny/aws-sdk/client-s3";
import type { Progress as BaseProgress, Upload as BaseUpload } from "@webiny/aws-sdk/lib-storage";

export type IAwsUpload = Pick<BaseUpload, "done" | "abort" | "on">;

export type IUploadDoneResult = CompleteMultipartUploadCommandOutput;

export type IUploadProgress = BaseProgress;

export interface IUploadOnListener {
    (progress: IUploadProgress): void;
}

export interface IUpload {
    client: S3Client;
    stream: PassThrough;
    upload: IAwsUpload;

    done(): Promise<IUploadDoneResult>;
    abort(): Promise<void>;
    onProgress(listener: IUploadOnListener): void;
}
