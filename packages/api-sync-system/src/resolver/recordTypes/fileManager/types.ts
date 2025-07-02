import type { LambdaTrigger } from "~/resolver/lambda/LambdaTrigger.js";
import type { S3Client, S3ClientConfig } from "@webiny/aws-sdk/client-s3/index.js";
import type { IFileLambdaPayload } from "~/types.js";

export interface IGetLambdaTriggerCb {
    (): LambdaTrigger<IFileLambdaPayload>;
}

export interface ICreateS3ClientCb {
    (params: S3ClientConfig): S3Client;
}
