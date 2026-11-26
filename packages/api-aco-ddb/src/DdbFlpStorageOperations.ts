import { DynamoDBClient } from "@webiny/db-dynamodb";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";

/** Folder-level permissions on DynamoDB, for the tenant of the scope that builds them. */
class DdbFlpStorageOperationsImpl
    extends FolderLevelPermissionsStorageOperations
    implements FlpStorageOperations.Interface
{
    public constructor(db: DynamoDBClient.Interface, scopeTenant: ScopeTenant.Interface) {
        super({ documentClient: db.client, scopeTenant });
    }
}

export const DdbFlpStorageOperations = FlpStorageOperations.createImplementation({
    implementation: DdbFlpStorageOperationsImpl,
    dependencies: [DynamoDBClient, ScopeTenant]
});
