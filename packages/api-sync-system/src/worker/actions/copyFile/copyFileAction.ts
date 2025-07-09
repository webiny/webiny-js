import { createWorkerActionPlugin } from "~/worker/plugins/WorkerActionPlugin.js";
import { CopyFile } from "./CopyFile.js";
import type { S3Client, S3ClientConfig } from "@webiny/aws-sdk/client-s3/index.js";
import type { ICopyFileActionEvent } from "./types.js";
import { createCopyFileSchema } from "./copyFileSchema.js";
import { logValidationError } from "~/worker/actions/logValidationError.js";

export interface ICreateCopyFileActionParams {
    createS3Client: (config: Partial<S3ClientConfig>) => Pick<S3Client, "send">;
}

export const createCopyFileAction = ({ createS3Client }: ICreateCopyFileActionParams) => {
    return createWorkerActionPlugin<ICopyFileActionEvent>({
        name: "sync.worker.action.copyFile",
        parse(input) {
            const schema = createCopyFileSchema();
            const result = schema.safeParse(input);
            if (!result.success || result.error) {
                logValidationError(result.error);
                return undefined;
            }
            return result.data;
        },
        async handle(params) {
            const { data } = params;
            const copyFile = new CopyFile({
                createS3Client,
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
