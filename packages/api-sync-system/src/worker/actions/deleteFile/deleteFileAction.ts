import { createWorkerActionPlugin } from "~/worker/plugins/WorkerActionPlugin.js";
import { DeleteFile } from "./DeleteFile.js";
import type { S3Client, S3ClientConfig } from "@webiny/aws-sdk/client-s3/index.js";
import { createDeleteFileSchema } from "./deleteFileSchema.js";
import type { IDeleteFileActionEvent } from "./types.js";
import { logValidationError } from "~/worker/actions/logValidationError.js";

export interface ICreateDeleteFileActionParams {
    createS3Client: (config: Partial<S3ClientConfig>) => Pick<S3Client, "send">;
}

export const createDeleteFileAction = ({ createS3Client }: ICreateDeleteFileActionParams) => {
    return createWorkerActionPlugin<IDeleteFileActionEvent>({
        name: "sync.worker.action.deleteFile",
        parse(input) {
            const schema = createDeleteFileSchema();
            const result = schema.safeParse(input);

            if (!result.success || result.error) {
                logValidationError(result.error);
                return undefined;
            }
            return result.data;
        },
        async handle(params) {
            const { data } = params;
            const deleteFile = new DeleteFile({
                createS3Client,
                region: data.target.region
            });
            return deleteFile.delete({
                key: data.key,
                bucket: data.target.bucket
            });
        }
    });
};
