import { type Container, createFeature } from "@webiny/feature/api";
import { DynamoDBClient } from "@webiny/db-dynamodb";
import { ConnectionRegistry } from "@webiny/api-websockets/features/ConnectionRegistry/abstractions.js";
import { WebsocketsConnectionRegistry } from "./WebsocketsConnectionRegistry.js";

export const WebsocketsDdbFeature = createFeature({
    name: "WebsocketsDdb",
    register(container: Container) {
        container.registerFactory(ConnectionRegistry, () => {
            const db = container.resolve(DynamoDBClient);
            return new WebsocketsConnectionRegistry(db.client);
        });
    }
});
