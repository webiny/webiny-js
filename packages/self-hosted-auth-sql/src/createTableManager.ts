import { KnexClient, SqlSchemaConfig } from "@webiny/api-core-sql";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";

/**
 * The login tables' manager on the container's connection and table settings. Cheap to build: what
 * it learns about the tables is kept for the process (see `TableManager`).
 */
export const createTableManager = (
    knex: KnexClient.Interface,
    schemaConfig?: SqlSchemaConfig.Interface
): TableManager => {
    return new TableManager(knex.client, schemaConfig?.tableNamePrefix, {
        schemaManaged: schemaConfig?.isManaged() === true
    });
};
