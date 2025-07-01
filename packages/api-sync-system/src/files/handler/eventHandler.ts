import type { IFileHandlerEvent } from "~/files/handler/types.js";
import { validatePayload } from "~/files/handler/validation/validate.js";
import { convertException } from "@webiny/utils";
import { ActionHandler } from "~/files/handler/ActionHandler.js";
import { createEventHandler } from "@webiny/handler-aws/raw/index.js";
import { S3Client, type S3ClientConfig } from "@webiny/aws-sdk/client-s3";

export interface ICreateFilesEventHandlerParams {
    createS3Client: (params: S3ClientConfig) => S3Client;
}

export const createEventHandlerPlugin = (params: ICreateFilesEventHandlerParams) => {
    const { createS3Client } = params;
    const plugin = createEventHandler<IFileHandlerEvent>(async ({ payload }) => {
        const { data, error, success } = await validatePayload({
            payload
        });
        if (!success || error) {
            console.error("Error validating input.");
            console.log(convertException(error));
            return;
        }

        const actionHandler = new ActionHandler({
            getS3Client: region => {
                return createS3Client({
                    region
                });
            }
        });

        try {
            await actionHandler.handle({
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
        }
    });

    plugin.name = `sync.files.eventHandler`;

    return plugin;
};
