import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { readSharedTables } from "./BuildParamsPgStorageConfig.js";

export interface IPgTableNames {
    tableNamePrefix?: string;
    tableNameSuffix?: string;
}

/**
 * The table names of the storage: prefix and suffix from the feature's config, shared tables from
 * the `CmsSharedTables` build param.
 */
export const createPgTableNameResolverConfig = (names: IPgTableNames) => {
    class PgTableNameResolverConfigImpl implements TableNameResolverConfig.Interface {
        public readonly sharedTables: boolean;
        public readonly tableNamePrefix = names.tableNamePrefix;
        public readonly tableNameSuffix = names.tableNameSuffix;

        public constructor(buildParams: BuildParams.Interface) {
            this.sharedTables = readSharedTables(buildParams);
        }
    }

    return TableNameResolverConfig.createImplementation({
        implementation: PgTableNameResolverConfigImpl,
        dependencies: [BuildParams]
    });
};
