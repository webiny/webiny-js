import { TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";

export interface IPgTableNames {
    tableNamePrefix?: string;
    tableNameSuffix?: string;
    sharedTables?: boolean;
}

/** The table names of the storage, from the feature's config. */
export const createPgTableNameResolverConfig = (names: IPgTableNames) => {
    class PgTableNameResolverConfigImpl implements TableNameResolverConfig.Interface {
        public readonly sharedTables = names.sharedTables === true;
        public readonly tableNamePrefix = names.tableNamePrefix;
        public readonly tableNameSuffix = names.tableNameSuffix;
    }

    return TableNameResolverConfig.createImplementation({
        implementation: PgTableNameResolverConfigImpl,
        dependencies: []
    });
};
