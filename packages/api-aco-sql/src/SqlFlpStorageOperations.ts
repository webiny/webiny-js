import { KnexClient, SqlSchemaConfig } from "@webiny/api-core-sql";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";

/** Folder-level permissions on the container's connection and table prefix, for its scope's tenant. */
class SqlFlpStorageOperationsImpl
    extends FolderLevelPermissionsStorageOperations
    implements FlpStorageOperations.Interface
{
    public constructor(
        knex: KnexClient.Interface,
        scopeTenant: ScopeTenant.Interface,
        schemaConfig?: SqlSchemaConfig.Interface
    ) {
        super({
            knex: knex.client,
            scopeTenant,
            tableNamePrefix: schemaConfig?.tableNamePrefix,
            schemaManaged: schemaConfig?.isManaged() === true
        });
    }
}

export const SqlFlpStorageOperations = FlpStorageOperations.createImplementation({
    implementation: SqlFlpStorageOperationsImpl,
    dependencies: [KnexClient, ScopeTenant, [SqlSchemaConfig, { optional: true }]]
});
