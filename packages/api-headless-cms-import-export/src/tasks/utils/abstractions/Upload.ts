import { PassThrough } from "stream";
import { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";
import { Upload as BaseUpload } from "@webiny/aws-sdk/lib-storage";

export type IAwsUpload = Pick<BaseUpload, "done">;

export interface IUpload {
    stream: PassThrough;
    upload: IAwsUpload;

    done(): Promise<CompleteMultipartUploadCommandOutput>;
}
