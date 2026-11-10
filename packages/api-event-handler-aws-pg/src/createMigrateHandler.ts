import type { Knex } from "knex";
import type { CreateWebinyApiHandlerConfig as BaseConfig } from "@webiny/api-event-handler-aws";
import { readBuildParams } from "@webiny/api-event-handler-core";
import type { IServiceManifest } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { getSqlTablePrefix, SqlServiceManifestWriter, TableManager } from "@webiny/api-core-sql";
import { setupPgSchema } from "@webiny/api-storage-pg";
import { createLambdaPgConnection } from "~/connection/createLambdaPgConnection.js";

export interface CreateAwsPgMigrateHandlerConfig extends Pick<BaseConfig, "extensions"> {
    /**
     * Opens the connection the migration runs on; the handler destroys it when it's done. Defaults
     * to a connection to `WEBINY_PG_WRITER_HOST`, else `WEBINY_PG_HOST`: schema changes go to the
     * cluster's writer, not through RDS Proxy. Injectable so tests can point it at a local Postgres.
     */
    createKnex?: () => Knex;
    /** Table name prefix. Defaults to `WEBINY_SQL_TABLE_PREFIX`, as the API handlers do. */
    tableNamePrefix?: string;
}

export interface AwsPgMigrateEvent {
    /**
     * Service manifests to store for service discovery. Each replaces the stored manifest of the
     * same name; manifests not passed are left as they are.
     */
    serviceManifests?: IServiceManifest[];
}

export interface AwsPgMigrateResult {
    ok: true;
    /** What the migration did, one line per step. */
    done: string[];
}

/** Postgres closes a session of the API's user after it has been idle this long, by default. */
const DEFAULT_IDLE_SESSION_TIMEOUT_MS = 600_000;

const readIdleSessionTimeoutMs = (): number => {
    const value = process.env.WEBINY_PG_IDLE_SESSION_TIMEOUT_MS;
    if (value === undefined || value === "") {
        return DEFAULT_IDLE_SESSION_TIMEOUT_MS;
    }
    const ms = Number(value);
    if (!Number.isInteger(ms) || ms < 0) {
        throw new Error(
            `WEBINY_PG_IDLE_SESSION_TIMEOUT_MS must be a whole number of milliseconds (0 turns it off), not "${value}".`
        );
    }
    return ms;
};

/**
 * The deploy-time migration of the API on Postgres, invoked by the deployment (not by API traffic):
 * 1. creates every table the API's storage uses (`setupPgSchema`), so the API can run with
 *    `WEBINY_SQL_SCHEMA_MANAGED=true` and the installation finds the database ready;
 * 2. sets `idle_session_timeout` on the database user (`WEBINY_PG_IDLE_SESSION_TIMEOUT_MS`, default
 *    10 minutes, 0 = off), so connections left open by old function copies after a deploy close;
 * 3. stores the service manifests it is given (`serviceManifests`), where service discovery reads
 *    them. The api deploy passes `core`, `api` and `scheduler`; the admin deploy passes `admin` alone.
 *
 * Every step is idempotent, so it runs on every deploy. It returns what it did, and throws when a
 * step fails, so the deploy fails with it.
 */
export function createAwsPgMigrateHandler(config: CreateAwsPgMigrateHandlerConfig) {
    const createKnex =
        config.createKnex ??
        (() => {
            return createLambdaPgConnection({
                host: process.env.WEBINY_PG_WRITER_HOST || process.env.WEBINY_PG_HOST
            });
        });

    return async (event?: AwsPgMigrateEvent | null): Promise<AwsPgMigrateResult> => {
        const serviceManifests = event?.serviceManifests ?? [];
        if (!Array.isArray(serviceManifests)) {
            throw new Error("`serviceManifests` must be a list of { name, manifest }.");
        }
        // Read before connecting, so a bad setting fails without touching the database.
        const idleSessionTimeoutMs = readIdleSessionTimeoutMs();
        const tableNamePrefix = config.tableNamePrefix ?? (getSqlTablePrefix() || undefined);
        const buildParams = await readBuildParams(config.extensions());

        const knex = createKnex();
        try {
            const done = await setupPgSchema({ knex, tableNamePrefix, buildParams });

            // A role default: it applies to new sessions of this user. ALTER ROLE takes no
            // bindings; the value is a checked integer.
            await knex.raw(
                `ALTER ROLE CURRENT_USER SET idle_session_timeout = ${idleSessionTimeoutMs}`
            );
            done.push(`idle_session_timeout ${idleSessionTimeoutMs} ms`);

            if (serviceManifests.length) {
                const writer = new SqlServiceManifestWriter(
                    knex,
                    new TableManager(knex, tableNamePrefix)
                );
                await writer.write(serviceManifests);
                done.push(
                    `service manifests: ${serviceManifests.map(item => item.name).join(", ")}`
                );
            }

            return { ok: true, done };
        } finally {
            await knex.destroy();
        }
    };
}
