import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";

interface RegisterAcoDdbStorageOperationsParams {
    documentClient: DynamoDBDocument;
}

export const registerAcoDdbStorageOperations = (params: RegisterAcoDdbStorageOperationsParams) => {
    return createRegisterExtensionPlugin(context => {
        const flpStorageOperations = new FolderLevelPermissionsStorageOperations({
            documentClient: params.documentClient
        });

        context.container.registerInstance(FlpStorageOperations, flpStorageOperations);
    });
};
export { AcoDdbFeature } from "./AcoDdbFeature.js";
