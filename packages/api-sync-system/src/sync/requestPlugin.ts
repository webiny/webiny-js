import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { ICommandConverter, IGetEventBridgeCallable, ISystem } from "~/sync/types.js";
import { createHandlerOnRequest } from "@webiny/handler";
import { getManifest } from "~/sync/utils/manifest.js";
import { attachToDynamoDbDocument } from "~/sync/attachToDynamoDbDocument.js";
import { createSendDataToEventBridgeOnRequestEnd } from "~/sync/createSendDataToEventBridgeOnRequestEnd.js";
import { createHandler } from "./createHandler.js";
import { convertException } from "@webiny/utils/exception.js";

export interface ICreateSyncSystemHandlerOnRequestPluginParams {
    getDocumentClient(): Pick<DynamoDBDocument, "send">;
    getEventBridgeClient: IGetEventBridgeCallable;
    system: ISystem;
    commandConverters?: ICommandConverter[];
}

export const createSyncSystemHandlerOnRequestPlugin = (
    params: ICreateSyncSystemHandlerOnRequestPluginParams
) => {
    return createHandlerOnRequest(async (_, __, context) => {
        const { data: manifest, error } = await getManifest(params);
        if (error) {
            if (process.env.DEBUG !== "true") {
                return;
            }
            console.error("Error happened when fetching manifest.");
            console.log(
                JSON.stringify({
                    error: convertException(error)
                })
            );
            return;
        } else if (!manifest?.sync?.region) {
            if (process.env.DEBUG !== "true") {
                return;
            }
            console.error("There is no manifest.");
            console.log(
                JSON.stringify({
                    manifest
                })
            );
            return;
        }

        const { handler } = createHandler({
            getEventBridgeClient: () => {
                return params.getEventBridgeClient({
                    region: manifest.sync.region
                });
            },
            system: params.system,
            manifest,
            commandConverters: params.commandConverters,
            getPlugins: () => {
                return context.plugins;
            }
        });

        attachToDynamoDbDocument({
            handler
        });
        context.plugins.register([
            /**
             * When request ends, send the data to the EventBridge.
             */
            createSendDataToEventBridgeOnRequestEnd(handler)
        ]);
    });
};
