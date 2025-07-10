import type { LambdaTrigger } from "~/resolver/lambda/LambdaTrigger.js";
import type { S3Client, S3ClientConfig } from "@webiny/aws-sdk/client-s3/index.js";
import type { IDeployment } from "~/resolver/deployment/types.js";
import type { InvokeCommandOutput } from "@webiny/aws-sdk/client-lambda/index.js";

export interface IGetLambdaTriggerCb<T> {
    (): LambdaTrigger<T>;
}

export interface ICreateS3ClientCb {
    (params: S3ClientConfig): Pick<S3Client, "send">;
}

export interface ICopyFileHandleParams {
    key: string;
    source: IDeployment;
    target: IDeployment;
}

export interface ICopyFile {
    handle(params: ICopyFileHandleParams): Promise<InvokeCommandOutput | null>;
}

export interface IDeleteFileHandleParams {
    key: string;
    source: IDeployment;
    target: IDeployment;
}

export interface IDeleteFile {
    handle(params: IDeleteFileHandleParams): Promise<InvokeCommandOutput | null>;
}
