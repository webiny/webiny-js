import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { WebsocketsConnectionRegistry } from "./WebsocketsConnectionRegistry.js";
import { ConnectionRegistry } from "@webiny/api-websockets/features/ConnectionRegistry/abstractions.js";

export { WebsocketsConnectionRegistry } from "./WebsocketsConnectionRegistry.js";

interface RegisterWebsocketsDdbStorageOperationsParams {
    documentClient: DynamoDBDocument;
}

export const registerWebsocketsDdbStorageOperations = (
    params: RegisterWebsocketsDdbStorageOperationsParams
) => {
    return createRegisterExtensionPlugin(context => {
        const registry = new WebsocketsConnectionRegistry(params.documentClient);
        context.container.registerInstance(ConnectionRegistry, registry);
    });
};
export { WebsocketsDdbFeature } from "./WebsocketsDdbFeature.js";
