import type { Knex } from "knex";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";

interface RegisterAcoSqlStorageOperationsParams {
    knex: Knex;
    tableNamePrefix?: string;
}

export const registerAcoSqlStorageOperations = (params: RegisterAcoSqlStorageOperationsParams) => {
    return createRegisterExtensionPlugin(context => {
        const flpStorageOperations = new FolderLevelPermissionsStorageOperations({
            knex: params.knex,
            tableNamePrefix: params.tableNamePrefix
        });

        context.container.registerInstance(FlpStorageOperations, flpStorageOperations);
    });
};
