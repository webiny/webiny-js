import type { Knex } from "knex";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { WebsocketsConnectionRegistry } from "./WebsocketsConnectionRegistry.js";
import { TableName as TableNameAbstraction } from "~/TableName/abstractions.js";
import { TableName } from "~/TableName/TableName.js";

interface RegisterWebsocketsSqlStorageOperationsParams {
    knex: Knex;
    tableNamePrefix?: string;
}

export const registerWebsocketsSqlStorageOperations = (
    params: RegisterWebsocketsSqlStorageOperationsParams
) => {
    return createRegisterExtensionPlugin(context => {
        context.container.registerInstance(
            TableNameAbstraction,
            new TableName(params.tableNamePrefix)
        );
        context.container.register(WebsocketsConnectionRegistry);
    });
};
