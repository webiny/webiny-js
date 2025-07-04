import type { CreateHandlerParams } from "@webiny/handler-aws/raw/index.js";
import { createHandler } from "@webiny/handler-aws/raw/index.js";
import { createEventHandlerPlugin } from "./handler/eventHandler.js";
import { PluginsContainer } from "@webiny/plugins/PluginsContainer.js";
import type { Plugin } from "@webiny/plugins/types.js";
import { createCopyFileAction } from "~/worker/actions/copyFile/copyFileAction.js";
import { createDeleteFileAction } from "~/worker/actions/deleteFile/deleteFileAction.js";
import type { S3Client, S3ClientConfig } from "@webiny/aws-sdk/client-s3/index.js";

export type IAllowedFilesResolverPlugins = Plugin[];

export interface IWorkerHandlerParams extends Omit<CreateHandlerParams, "plugins"> {
    plugins?: IAllowedFilesResolverPlugins[];
    createS3Client: (params: S3ClientConfig) => S3Client;
}

export const createWorkerHandler = (params: IWorkerHandlerParams) => {
    const { createS3Client } = params;
    const plugins = new PluginsContainer(params.plugins || []);

    const getS3Client = (region: string) => {
        return createS3Client({
            region
        });
    };
    /**
     * Default action plugins are registered here.
     */
    plugins.register(
        createCopyFileAction({
            getS3Client
        })
    );
    plugins.register(
        createDeleteFileAction({
            getS3Client
        })
    );

    plugins.register(createEventHandlerPlugin());
    return createHandler({
        ...params,
        plugins
    });
};
