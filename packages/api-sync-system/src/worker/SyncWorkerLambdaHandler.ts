import { convertException } from "@webiny/utils";
import { PluginsContainer } from "@webiny/plugins";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { SyncWorkerEventHandler } from "./SyncWorkerEventHandler.js";
import type { ISyncWorkerEvent, ISyncWorkerResult } from "./SyncWorkerEventHandler.js";
import { SyncWorkerConfig } from "./SyncWorkerConfig.js";
import type { ISyncWorkerConfig } from "./SyncWorkerConfig.js";
import { WorkerActionHandler } from "~/worker/handler/WorkerActionHandler.js";
import { WorkerActionPlugin } from "~/worker/plugins/WorkerActionPlugin.js";
import { createCopyFileAction } from "~/worker/actions/copyFile/copyFileAction.js";
import { createDeleteFileAction } from "~/worker/actions/deleteFile/deleteFileAction.js";
import { createCreateUserAction } from "~/worker/actions/createUser/createUserAction.js";
import { createUpdateUserAction } from "~/worker/actions/updateUser/updateUserAction.js";
import { createDeleteUserAction } from "~/worker/actions/deleteUser/deleteUserAction.js";

class SyncWorkerLambdaHandlerImpl implements SyncWorkerEventHandler.Interface {
    constructor(private config: ISyncWorkerConfig) {}

    async execute(
        eventCtx: EventContext<ISyncWorkerEvent>,
        _next: NextFunction
    ): Promise<ISyncWorkerResult> {
        const { createS3Client, createCognitoIdentityProviderClient } = this.config;

        const plugins = new PluginsContainer([
            createCopyFileAction({ createS3Client }),
            createDeleteFileAction({ createS3Client }),
            createCreateUserAction({ createCognitoProvider: createCognitoIdentityProviderClient }),
            createUpdateUserAction({ createCognitoProvider: createCognitoIdentityProviderClient }),
            createDeleteUserAction({ createCognitoProvider: createCognitoIdentityProviderClient }),
            ...(this.config.plugins || [])
        ]);

        const handler = new WorkerActionHandler({
            plugins: plugins.byType<WorkerActionPlugin>(WorkerActionPlugin.type)
        });

        try {
            await handler.handle(eventCtx.event);
            return { success: true };
        } catch (ex) {
            console.error("Error while handling sync worker action.");
            console.log(convertException(ex));
            return { success: false };
        }
    }
}

export const SyncWorkerLambdaHandler = SyncWorkerEventHandler.createImplementation({
    implementation: SyncWorkerLambdaHandlerImpl,
    dependencies: [SyncWorkerConfig]
});
