import { PassThrough } from "stream";
import { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";
import { Upload as BaseUpload } from "@webiny/aws-sdk/lib-storage";

export type IAwsUpload = Pick<BaseUpload, "done" | "abort">;

export type IUploadDoneResult = CompleteMultipartUploadCommandOutput;

export interface IUpload {
    stream: PassThrough;
    upload: IAwsUpload;

    done(): Promise<IUploadDoneResult>;
    abort(): Promise<void>;
}
