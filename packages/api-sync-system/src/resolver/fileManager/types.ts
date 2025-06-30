import { LambdaTrigger } from "~/resolver/app/lambda/LambdaTrigger.js";
import { S3Client, type S3ClientConfig } from "@webiny/aws-sdk/client-s3/index.js";
import type { IFileLambdaPayload } from "~/types.js";

export interface IGetLambdaTriggerCb {
    (): LambdaTrigger<IFileLambdaPayload>;
}

export interface ICreateS3ClientCb {
    (params: S3ClientConfig): S3Client;
}
