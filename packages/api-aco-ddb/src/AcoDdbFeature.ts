import { type Container, createFeature } from "@webiny/feature/api";
import { DynamoDBClient } from "@webiny/db-dynamodb";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";

export const AcoDdbFeature = createFeature({
    name: "AcoDdb",
    register(container: Container) {
        // Lazy factory: DynamoDBClient is resolved at first use
        container.registerFactory(FlpStorageOperations, () => {
            const db = container.resolve(DynamoDBClient);
            return new FolderLevelPermissionsStorageOperations({
                documentClient: db.client
            });
        });
    }
});
