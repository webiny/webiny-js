import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { TaskCatalogFlpFeature } from "@webiny/api-aco/flpTaskCatalog/index.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

interface RegisterAcoDdbStorageOperationsParams {
    documentClient: DynamoDBDocument;
}

export const registerAcoDdbStorageOperations = (params: RegisterAcoDdbStorageOperationsParams) => {
    return createRegisterExtensionPlugin(context => {
        const container = context.container;
        // Built when first used, in the container that registered it (a tenant scope), with that
        // scope's tenant.
        container.registerFactory(FlpStorageOperations, () => {
            return new FolderLevelPermissionsStorageOperations({
                documentClient: params.documentClient,
                scopeTenant: container.resolve(ScopeTenant)
            });
        });
        // Folder-level permissions on this storage use the task-maintained FLP catalog.
        TaskCatalogFlpFeature.register(context.container);
    });
};
export { AcoDdbFeature } from "./AcoDdbFeature.js";
