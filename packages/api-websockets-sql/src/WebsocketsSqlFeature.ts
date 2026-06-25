import { type Container, createFeature } from "@webiny/feature/api";
import { TableName as TableNameAbstraction } from "~/TableName/abstractions.js";
import { TableName } from "~/TableName/TableName.js";
import { WebsocketsConnectionRegistry } from "./WebsocketsConnectionRegistry.js";

export interface WebsocketsSqlConfig {
    tableNamePrefix?: string;
}

export const WebsocketsSqlFeature = createFeature<WebsocketsSqlConfig | undefined>({
    name: "WebsocketsSql",
    register(container: Container, config?) {
        container.registerInstance(TableNameAbstraction, new TableName(config?.tableNamePrefix));
        container.register(WebsocketsConnectionRegistry);
    }
});
