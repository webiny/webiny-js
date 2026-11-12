import { ApiCoreStorageOperationsFactory } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createApiCoreSql } from "~/createApiCoreSql.js";
import { KnexClient } from "~/feature/KnexClient/index.js";
import { SqlSchemaConfig } from "~/schemaConfig/index.js";

/** Builds the core storage operations on the container's connection and table prefix. */
class SqlApiCoreStorageOperationsFactoryImpl implements ApiCoreStorageOperationsFactory.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schemaConfig?: SqlSchemaConfig.Interface
    ) {}

    public create(): ApiCoreStorageOperations {
        return createApiCoreSql({
            knex: this.knex.client,
            tableNamePrefix: this.schemaConfig?.tableNamePrefix,
            schemaManaged: this.schemaConfig?.isManaged() === true
        });
    }
}

export const SqlApiCoreStorageOperationsFactory =
    ApiCoreStorageOperationsFactory.createImplementation({
        implementation: SqlApiCoreStorageOperationsFactoryImpl,
        dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
    });
