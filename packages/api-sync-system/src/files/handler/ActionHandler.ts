import type { S3Client } from "@webiny/aws-sdk/client-s3";
import { CopyFile } from "./copy/CopyFile";
import { DeleteFile } from "./delete/DeleteFile.js";
import type { IFileLambdaPayload } from "~/types.js";

export interface IActionHandlerParamsGetS3ClientCb {
    (region: string): S3Client;
}

export interface IActionHandlerParams {
    getS3Client: IActionHandlerParamsGetS3ClientCb;
}

export class ActionHandler {
    private readonly getS3Client: IActionHandlerParamsGetS3ClientCb;

    public constructor(params: IActionHandlerParams) {
        this.getS3Client = params.getS3Client;
    }

    public async handle(data: IFileLambdaPayload): Promise<void> {
        const { action, source, target, key } = data;

        switch (action) {
            case "copy":
                const copyFile = new CopyFile({
                    getS3Client: this.getS3Client,
                    sourceRegion: source.region,
                    targetRegion: target.region
                });

                return await copyFile.copy({
                    key,
                    sourceBucket: source.bucket,
                    targetBucket: target.bucket
                });
            case "delete":
                const deleteFile = new DeleteFile({
                    getS3Client: this.getS3Client,
                    region: target.region
                });
                return await deleteFile.delete({
                    bucket: target.bucket,
                    key
                });
            default:
                throw new Error("Unsupported action: " + action);
        }
    }
}
