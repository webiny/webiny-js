import type { CreateHandlerParams } from "@webiny/handler-aws/raw/index.js";
import { createHandler } from "@webiny/handler-aws/raw/index.js";
import { createEventHandlerPlugin } from "./handler/eventHandler.js";
import { PluginsContainer } from "@webiny/plugins/PluginsContainer.js";
import type { Plugin } from "@webiny/plugins/types.js";
import { createCopyFileAction } from "~/worker/actions/copyFile/copyFileAction.js";
import { createDeleteFileAction } from "~/worker/actions/deleteFile/deleteFileAction.js";
import type { S3Client, S3ClientConfig } from "@webiny/aws-sdk/client-s3/index.js";
import { createCreateUserAction } from "~/worker/actions/createUser/createUserAction.js";
import { createUpdateUserAction } from "~/worker/actions/updateUser/updateUserAction.js";
import {
    type CognitoIdentityProvider,
    type CognitoIdentityProviderClientConfig
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { createDeleteUserAction } from "~/worker/actions/deleteUser/deleteUserAction.js";

export type IAllowedWorkerHandlerPlugins = Plugin[];

export interface IWorkerHandlerParams extends Omit<CreateHandlerParams, "plugins"> {
    plugins?: IAllowedWorkerHandlerPlugins[];
    createS3Client: (params: S3ClientConfig) => Pick<S3Client, "send">;
    createCognitoIdentityProviderClient(
        input: CognitoIdentityProviderClientConfig
    ): Pick<CognitoIdentityProvider, "send">;
}

export const createWorkerHandler = (params: IWorkerHandlerParams) => {
    const { createS3Client, createCognitoIdentityProviderClient } = params;
    const plugins = new PluginsContainer(params.plugins || []);

    /**
     * Default action plugins are registered here.
     */
    plugins.register(
        createCopyFileAction({
            createS3Client
        })
    );
    plugins.register(
        createDeleteFileAction({
            createS3Client
        })
    );
    plugins.register(
        createCreateUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        })
    );
    plugins.register(
        createUpdateUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        })
    );
    plugins.register(
        createDeleteUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        })
    );

    plugins.register(createEventHandlerPlugin());
    return createHandler({
        ...params,
        plugins
    });
};
