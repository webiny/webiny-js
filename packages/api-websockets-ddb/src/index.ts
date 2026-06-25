import { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { WebsocketsConnectionRegistry } from "./WebsocketsConnectionRegistry.js";
import { ConnectionRegistry } from "@webiny/api-websockets/features/ConnectionRegistry/abstractions.js";

export { WebsocketsConnectionRegistry } from "./WebsocketsConnectionRegistry.js";

export const registerWebsocketsDdbStorageOperations = () => {
    return createRegisterExtensionPlugin(context => {
        const tableFactory = context.container.resolve(DynamoDbTableFactory);
        const entityFactory = context.container.resolve(DynamoDbEntityFactory);
        const registry = new WebsocketsConnectionRegistry(tableFactory, entityFactory);
        context.container.registerInstance(ConnectionRegistry, registry);
    });
};
