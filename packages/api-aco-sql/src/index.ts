import type { Knex } from "knex";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";

interface RegisterAcoSqlStorageOperationsParams {
    knex: Knex;
}

export const registerAcoSqlStorageOperations = (params: RegisterAcoSqlStorageOperationsParams) => {
    return createRegisterExtensionPlugin(context => {
        const flpStorageOperations = new FolderLevelPermissionsStorageOperations({
            knex: params.knex
        });

        context.container.registerInstance(FlpStorageOperations, flpStorageOperations);
    });
};
