import { SqlSchemaConfig } from "@webiny/api-core-sql";
import { TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { PgStorageConfig } from "./abstractions.js";

/**
 * The table names of the storage: the SQL storage's table prefix (`SqlSchemaConfig`, registered by
 * the storage the module runs on) and the module's `sharedTables` setting.
 */
class PgTableNameResolverConfigImpl implements TableNameResolverConfig.Interface {
    public readonly sharedTables: boolean;
    public readonly tableNamePrefix?: string;
    public readonly tableNameSuffix = undefined;

    public constructor(schemaConfig: SqlSchemaConfig.Interface, config: PgStorageConfig.Interface) {
        this.tableNamePrefix = schemaConfig.tableNamePrefix || undefined;
        this.sharedTables = config.sharedTables;
    }
}

export const PgTableNameResolverConfig = TableNameResolverConfig.createImplementation({
    implementation: PgTableNameResolverConfigImpl,
    dependencies: [SqlSchemaConfig, PgStorageConfig]
});
