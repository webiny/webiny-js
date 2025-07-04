import { createWorkerActionPlugin } from "~/worker/plugins/WorkerActionPlugin.js";
import type { IWorkerActionHandleParams } from "~/worker/types.js";
import { CopyFile } from "./CopyFile.js";
import type { S3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { createCopySchema } from "~/worker/actions/copyFile/copySchema.js";
import type { ICopyFileActionEvent } from "./types.js";

export interface ICreateCopyFileActionParams {
    getS3Client: (region: string) => S3Client;
}

export const createCopyFileAction = ({ getS3Client }: ICreateCopyFileActionParams) => {
    return createWorkerActionPlugin({
        parse(input: unknown) {
            const schema = createCopySchema();
            const validation = schema.safeParse({ payload: input });
            if (!validation.success || validation.error) {
                return undefined;
            }
            return validation.data;
        },
        async handle(params: IWorkerActionHandleParams<ICopyFileActionEvent>): Promise<void> {
            const { data } = params;
            const copyFile = new CopyFile({
                getS3Client,
                sourceRegion: data.source.region,
                targetRegion: data.target.region,
                maxConcurrency: undefined,
                maxPartSize: undefined,
                minPartSize: undefined
            });
            return copyFile.copy({
                key: data.key,
                sourceBucket: data.source.bucket,
                targetBucket: data.target.bucket
            });
        }
    });
};
