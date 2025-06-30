import { createEventHandler } from "@webiny/handler-aws/raw/index.js";
import type { IFileHandlerEvent } from "./handler/types.js";
import { convertException } from "@webiny/utils";
import { validatePayload } from "./handler/validation/validate.js";
import { S3Client, type S3ClientConfig } from "@webiny/aws-sdk/client-s3/index.js";
import { FileHandler } from "./handler/FileHandler.js";
import { createZodError } from "@webiny/utils/createZodError.js";

export interface ICreateHandlerParams {
    createS3Client: (params: S3ClientConfig) => S3Client;
}

export const createHandler = (params: ICreateHandlerParams) => {
    const { createS3Client } = params;
    return createEventHandler<IFileHandlerEvent>(async ({ payload }) => {
        const { data, error, success } = await validatePayload({
            payload
        });
        if (!success || error) {
            console.error("Error validating input.");
            console.log(convertException(error));
            throw createZodError(error);
        }

        const handler = new FileHandler({
            getS3Client: region => {
                return createS3Client({
                    region
                });
            }
        });

        try {
            await handler.handle({
                action: data.action,
                source: data.source,
                target: data.target,
                key: data.key
            });
        } catch (ex) {
            console.error("Error handling file.");
            console.log(convertException(ex));
            console.log({
                ...data
            });
            throw ex;
        }
    });
};
