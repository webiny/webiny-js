import { Container } from "@webiny/di";
import { TableManager } from "@webiny/api-core-sql";
import { PgSchema } from "@webiny/api-headless-cms-pg/features/schema/abstractions.js";
import { FolderCatalogSchema } from "@webiny/api-aco-pg/catalog/FolderCatalogSchema.js";
import { TableNameResolver } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { ModelSchemaManager } from "@webiny/api-headless-cms-sql/features/modelSchemaManager/abstractions.js";
import { GroupSchemaManager } from "@webiny/api-headless-cms-sql/features/groupSchemaManager/abstractions.js";
import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { registerPgRootStorage, type PgRootStorageParams } from "./registerPgRootStorage.js";

interface ISchemaSetupTarget {
    setupSchema(): Promise<void>;
}

const hasSetupSchema = (value: unknown): value is ISchemaSetupTarget => {
    return typeof (value as ISchemaSetupTarget | undefined)?.setupSchema === "function";
};

export type SetupPgSchemaParams = PgRootStorageParams;

/**
 * Creates every table, index, function and trigger the Postgres storage uses (see
 * `registerPgRootStorage`), at deploy time. It runs before the system is installed, so the
 * installation finds the database ready, and the API then runs with `WEBINY_SQL_SCHEMA_MANAGED=true`:
 * it never checks for or creates tables.
 *
 * It builds the same storage as the API, in a container of its own (the storage declares its
 * tables), then asks each part for its schema. Idempotent: a second run creates nothing.
 *
 * Like the API's storage, it points service discovery at `knex`. Run it in a process of its own
 * (a deploy-time function), not in one that serves the API with another connection.
 *
 * Returns what it set up, one line per part.
 */
export async function setupPgSchema(params: SetupPgSchemaParams): Promise<string[]> {
    const done: string[] = [];
    const container = new Container();
    await registerPgRootStorage(container, params);

    // Core (including the service manifests table) and audit logs: the tables declared on their
    // TableManagers.
    await TableManager.setupAll(params.knex);
    done.push("core and audit log tables");

    const tables = container.resolve(TableNameResolver);
    await container.resolve(ModelSchemaManager).setup(tables.resolve("models"));
    await container.resolve(GroupSchemaManager).setup(tables.resolve("groups"));
    done.push("CMS models and groups");

    await container.resolve(PgSchema).setup();
    done.push("CMS entries, search, scopes and value counts");

    await container.resolve(FolderCatalogSchema).ensure();
    done.push("ACO folder catalog");

    const connections = container.resolve(ConnectionRegistry);
    if (!hasSetupSchema(connections)) {
        throw new Error("The websockets connection registry can't set up its schema.");
    }
    await connections.setupSchema();
    done.push("websocket connections");

    return done;
}
