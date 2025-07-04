import { createWorkerActionPlugin } from "~/worker/plugins/WorkerActionPlugin.js";
import { DeleteFile } from "./DeleteFile.js";
import type { S3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { createDeleteFileSchema } from "./deleteFileSchema.js";
import type { IDeleteFileActionEvent } from "./types.js";
import { logValidationError } from "~/worker/actions/logValidationError.js";

export interface ICreateDeleteFileActionParams {
    getS3Client: (region: string) => Pick<S3Client, "send">;
}

export const createDeleteFileAction = ({ getS3Client }: ICreateDeleteFileActionParams) => {
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
                getS3Client,
                region: data.target.region
            });
            return deleteFile.delete({
                key: data.key,
                bucket: data.target.bucket
            });
        }
    });
};
