import type { Knex } from "knex";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { WebsocketsConnectionRegistry } from "./WebsocketsConnectionRegistry.js";
import { ConnectionRegistry } from "@webiny/api-websockets";

interface RegisterWebsocketsSqlStorageOperationsParams {
    knex: Knex;
    tableNamePrefix?: string;
}

export const registerWebsocketsSqlStorageOperations = (
    params: RegisterWebsocketsSqlStorageOperationsParams
) => {
    return createRegisterExtensionPlugin(context => {
        const registry = new WebsocketsConnectionRegistry({
            knex: params.knex,
            tableNamePrefix: params.tableNamePrefix
        });
        context.container.registerInstance(ConnectionRegistry, registry);
    });
};
