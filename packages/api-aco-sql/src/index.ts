import { createFeature } from "@webiny/feature/api";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { KnexClient, SqlSchemaConfig, SqlSchemaSetup } from "@webiny/api-core-sql";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { TaskCatalogFlpFeature } from "@webiny/api-aco/flpTaskCatalog/index.js";

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

const SqlFlpStorageOperations = FlpStorageOperations.createImplementation({
    implementation: SqlFlpStorageOperationsImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});

/** The `aco` schema setup step: the folder-level permissions table. */
class AcoSqlSchemaSetupImpl implements SqlSchemaSetup.Interface {
    public readonly name = "aco";

    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schemaConfig?: SqlSchemaConfig.Interface
    ) {}

    public setup(): Promise<void> {
        const operations = new FolderLevelPermissionsStorageOperations({
            knex: this.knex.client,
            tableNamePrefix: this.schemaConfig?.tableNamePrefix
        });
        return operations.setupSchema();
    }
}

const AcoSqlSchemaSetup = SqlSchemaSetup.createImplementation({
    implementation: AcoSqlSchemaSetupImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});

/**
 * ACO folder-level permissions on SQL, and the `aco` schema setup step. Registered per request, it
 * runs on the connection (`KnexClient`) and the table settings (`SqlSchemaConfig`) the SQL storage
 * keeps in the root. Folder-level permissions on this storage use the task-maintained FLP catalog.
 */
export const AcoSqlFeature = createFeature({
    name: "AcoSql",
    register(container) {
        container.register(SqlFlpStorageOperations);
        container.register(AcoSqlSchemaSetup);
        TaskCatalogFlpFeature.register(container);
    }
});

/** `AcoSqlFeature` as an extension plugin, for setups that register storages that way. */
export const registerAcoSqlStorageOperations = () => {
    return createRegisterExtensionPlugin(context => {
        AcoSqlFeature.register(context.container);
    });
};
