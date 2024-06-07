import { PassThrough } from "stream";
import { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";

export interface IUpload {
    stream: PassThrough;

    done(): Promise<CompleteMultipartUploadCommandOutput>;
}
