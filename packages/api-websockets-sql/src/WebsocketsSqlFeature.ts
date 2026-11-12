import { type Container, createFeature } from "@webiny/feature/api";
import { SchemaConfigTableName } from "~/TableName/SchemaConfigTableName.js";
import {
    WebsocketsConnectionRegistry,
    WebsocketsSchemaSetup
} from "./WebsocketsConnectionRegistry.js";

/**
 * The websocket connection registry on SQL, and its `websockets` schema setup step. Registered per
 * request, it runs on the connection (`KnexClient`) and the table prefix (`SqlSchemaConfig`) the SQL
 * storage keeps in the root.
 */
export const WebsocketsSqlFeature = createFeature({
    name: "WebsocketsSql",
    register(container: Container) {
        container.register(SchemaConfigTableName);
        container.register(WebsocketsConnectionRegistry);
        container.register(WebsocketsSchemaSetup);
    }
});
