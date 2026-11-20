import { KnexClient, SqlSchemaConfig, SqlSchemaSetup } from "@webiny/api-core-sql";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";

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

export const AcoSqlSchemaSetup = SqlSchemaSetup.createImplementation({
    implementation: AcoSqlSchemaSetupImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});
