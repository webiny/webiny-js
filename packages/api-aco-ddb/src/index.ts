import { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";

export const registerAcoDdbStorageOperations = () => {
    return createRegisterExtensionPlugin(context => {
        const tableFactory = context.container.resolve(DynamoDbTableFactory);
        const entityFactory = context.container.resolve(DynamoDbEntityFactory);
        const flpStorageOperations = new FolderLevelPermissionsStorageOperations({
            tableFactory,
            entityFactory
        });

        context.container.registerInstance(FlpStorageOperations, flpStorageOperations);
    });
};
