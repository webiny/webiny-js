import type { KnexClient, SqlSchemaConfig } from "@webiny/api-core-sql";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";

/** The audit logs' table manager, on the container's connection and table prefix. */
export const createTableManager = (
    knex: KnexClient.Interface,
    schemaConfig: SqlSchemaConfig.Interface | undefined,
    schemaManaged: boolean
): TableManager => {
    return new TableManager(knex.client, schemaConfig?.tableNamePrefix, { schemaManaged });
};
