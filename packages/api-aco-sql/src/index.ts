import type { Knex } from "knex";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { TaskCatalogFlpFeature } from "@webiny/api-aco/flpTaskCatalog/index.js";

interface RegisterAcoSqlStorageOperationsParams {
    knex: Knex;
    tableNamePrefix?: string;
    /** The schema was set up before the API took traffic: no table checks at runtime. */
    schemaManaged?: boolean;
}

export const registerAcoSqlStorageOperations = (params: RegisterAcoSqlStorageOperationsParams) => {
    return createRegisterExtensionPlugin(context => {
        const flpStorageOperations = new FolderLevelPermissionsStorageOperations({
            knex: params.knex,
            tableNamePrefix: params.tableNamePrefix,
            schemaManaged: params.schemaManaged
        });

        context.container.registerInstance(FlpStorageOperations, flpStorageOperations);
        // Folder-level permissions on this storage use the task-maintained FLP catalog.
        TaskCatalogFlpFeature.register(context.container);
    });
};
