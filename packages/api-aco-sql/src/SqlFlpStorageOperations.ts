import { KnexClient, SqlSchemaConfig } from "@webiny/api-core-sql";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";

/** Folder-level permissions on the container's connection and table prefix. */
class SqlFlpStorageOperationsImpl
    extends FolderLevelPermissionsStorageOperations
    implements FlpStorageOperations.Interface
{
    public constructor(knex: KnexClient.Interface, schemaConfig?: SqlSchemaConfig.Interface) {
        super({
            knex: knex.client,
            tableNamePrefix: schemaConfig?.tableNamePrefix,
            schemaManaged: schemaConfig?.isManaged() === true
        });
    }
}

export const SqlFlpStorageOperations = FlpStorageOperations.createImplementation({
    implementation: SqlFlpStorageOperationsImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});
