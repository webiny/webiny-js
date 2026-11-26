import { KnexClient, SqlSchemaConfig, SqlSchemaSetup } from "@webiny/api-core-sql";
import { tenantNeutralScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
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
            tableNamePrefix: this.schemaConfig?.tableNamePrefix,
            // The setup runs in no tenant, and only creates the table.
            scopeTenant: tenantNeutralScopeTenant
        });
        return operations.setupSchema();
    }
}

export const AcoSqlSchemaSetup = SqlSchemaSetup.createImplementation({
    implementation: AcoSqlSchemaSetupImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});
