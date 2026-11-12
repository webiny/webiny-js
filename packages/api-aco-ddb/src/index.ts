import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { TaskCatalogFlpFeature } from "@webiny/api-aco/flpTaskCatalog/index.js";

interface RegisterAcoDdbStorageOperationsParams {
    documentClient: DynamoDBDocument;
}

export const registerAcoDdbStorageOperations = (params: RegisterAcoDdbStorageOperationsParams) => {
    return createRegisterExtensionPlugin(context => {
        const flpStorageOperations = new FolderLevelPermissionsStorageOperations({
            documentClient: params.documentClient
        });

        context.container.registerInstance(FlpStorageOperations, flpStorageOperations);
        // Folder-level permissions on this storage use the task-maintained FLP catalog.
        TaskCatalogFlpFeature.register(context.container);
    });
};
export { AcoDdbFeature } from "./AcoDdbFeature.js";
