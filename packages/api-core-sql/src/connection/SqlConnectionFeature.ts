import type { Knex } from "knex";
import { createFeature } from "@webiny/feature/api";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { KnexClientFeature } from "~/feature/KnexClient/index.js";
import { SqlSchemaConfig } from "~/schemaConfig/index.js";
import { SqlServiceManifestLoader } from "~/serviceDiscovery/index.js";
import { TableManager } from "~/TableManager.js";

export interface SqlConnectionConfig {
    knex: Knex;
    tableNamePrefix?: string;
    /**
     * The schema was set up before the API took traffic (the storage's schema setup ran), so no
     * storage code checks for or creates tables at runtime. Off by default: tables are created on
     * first use. A function when it can change: a server turns it on once its setup at start ran.
     */
    schemaManaged?: boolean | (() => boolean);
}

const isManaged = (schemaManaged: SqlConnectionConfig["schemaManaged"]): boolean => {
    return typeof schemaManaged === "function" ? schemaManaged() : schemaManaged === true;
};

/**
 * What a SQL storage puts in the root container, once per process: the connection (`KnexClient`)
 * and its settings, the table prefix and the schema-managed setting (`SqlSchemaConfig`). Every
 * storage part registered per request, and every module on the storage (the Postgres CMS, the folder
 * catalog), runs on these.
 *
 * It holds no feature's storage: those register per request (`RequestStorage`).
 */
export const SqlConnectionFeature = createFeature<SqlConnectionConfig>({
    name: "SqlConnection",
    register(container, { knex, tableNamePrefix, schemaManaged = false }) {
        KnexClientFeature.register(container, knex);
        container.registerInstance(SqlSchemaConfig, {
            isManaged: () => isManaged(schemaManaged),
            tableNamePrefix
        });
    }
});

/**
 * Points service discovery at the manifests table of a connection. The loader is a static global of
 * the process, not a DI registration, so a storage sets it once, when it registers in the root.
 */
export const setSqlServiceManifestLoader = (config: SqlConnectionConfig): void => {
    const tableManager = new TableManager(config.knex, config.tableNamePrefix, {
        schemaManaged: () => isManaged(config.schemaManaged)
    });
    ServiceDiscovery.setLoader(new SqlServiceManifestLoader(config.knex, tableManager));
};
