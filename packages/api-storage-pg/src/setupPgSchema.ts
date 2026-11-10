import type { Knex } from "knex";
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

export type SetupPgSchemaParams = Omit<PgRootStorageParams, "schemaManaged">;

/**
 * The advisory lock every schema setup of one storage takes. Keyed by the table prefix, so storages
 * of different prefixes in one database don't wait for each other.
 */
const setupLockKey = (tableNamePrefix?: string): string => {
    return `${tableNamePrefix ?? ""}webiny_schema_setup`;
};

/**
 * Creates every table, index, function and trigger the Postgres storage uses (see
 * `registerPgRootStorage`), before the API takes traffic. The installation then finds the database
 * ready, and the API runs schema-managed (`registerPgRootStorage({ schemaManaged: true })`): it
 * never checks for or creates tables.
 *
 * It all runs in one transaction that first takes an advisory lock, so several processes starting
 * together run it one after another: the second finds everything in place. A failure rolls the whole
 * setup back. Setup only adds what's missing (`IF NOT EXISTS`); it never alters or drops.
 *
 * It builds the same storage as the API, in a container of its own and on that transaction (the
 * storage declares its tables), then asks each part for its schema. Idempotent: a second run creates
 * nothing.
 *
 * Like the API's storage, it points service discovery at the connection it runs on. Run it in a
 * process of its own (a deploy-time function), not in one that serves the API with another
 * connection.
 *
 * Returns what it set up, one line per part.
 */
export async function setupPgSchema(params: SetupPgSchemaParams): Promise<string[]> {
    return params.knex.transaction(async trx => {
        // Held until the transaction ends. The parts below that lock on their own (the CMS and the
        // folder catalog) nest in this transaction, so they don't wait for themselves.
        await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [
            setupLockKey(params.tableNamePrefix)
        ]);
        return setupIn(trx, params);
    });
}

async function setupIn(trx: Knex.Transaction, params: SetupPgSchemaParams): Promise<string[]> {
    const done: string[] = [];
    const container = new Container();
    await registerPgRootStorage(container, { ...params, knex: trx });

    // Core (including the service manifests table) and audit logs: the tables declared on their
    // TableManagers.
    await TableManager.setupAll(trx);
    done.push("core and audit log tables");

    const tables = container.resolve(TableNameResolver);
    await container.resolve(ModelSchemaManager).setup(tables.resolve("models"));
    await container.resolve(GroupSchemaManager).setup(tables.resolve("groups"));
    done.push("CMS models and groups");

    await container.resolve(PgSchema).setup();
    done.push("CMS entries, search, scopes and value counts");

    await container.resolve(FolderCatalogSchema).setup();
    done.push("ACO folder catalog");

    const connections = container.resolve(ConnectionRegistry);
    if (!hasSetupSchema(connections)) {
        throw new Error("The websockets connection registry can't set up its schema.");
    }
    await connections.setupSchema();
    done.push("websocket connections");

    return done;
}
