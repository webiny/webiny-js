import { createWorkerActionPlugin } from "~/worker/plugins/WorkerActionPlugin.js";
import type { IWorkerActionHandleParams } from "~/worker/types.js";
import { DeleteFile } from "./DeleteFile.js";
import type { S3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { createDeleteSchema } from "./deleteSchema.js";
import type { IDeleteFileActionEvent } from "./types.js";

export interface ICreateDeleteFileActionParams {
    getS3Client: (region: string) => S3Client;
}

export const createDeleteFileAction = ({ getS3Client }: ICreateDeleteFileActionParams) => {
    return createWorkerActionPlugin({
        parse(input: unknown) {
            const schema = createDeleteSchema();
            const validation = schema.safeParse({ payload: input });

            if (!validation.success || validation.error) {
                return undefined;
            }
            return validation.data;
        },
        async handle(params: IWorkerActionHandleParams<IDeleteFileActionEvent>): Promise<void> {
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
