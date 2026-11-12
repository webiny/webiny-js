import { ApiRequestRegistration } from "@webiny/api-event-handler-core";
import {
    SqlSchemaConfig,
    SqlSchemaSetupRunner,
    SqlServiceManifestWriter,
    TableManager
} from "@webiny/api-core-sql";
import { SqlSchemaSetupConnection, SqlSchemaSetupService } from "./abstractions.js";

/** Postgres closes a session of the API's user after it has been idle this long, by default. */
const DEFAULT_IDLE_SESSION_TIMEOUT_MS = 600_000;

/**
 * `WEBINY_PG_IDLE_SESSION_TIMEOUT_MS` is set on the function by the deployment, next to the other
 * `WEBINY_PG_*` connection settings the Lambda connection reads. It is read from the environment,
 * not from `BuildParams`: those are registered in a request's container, and this service runs in
 * the root.
 */
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
 * On its own connection to the writer:
 * 1. runs the storage's schema setup (`SqlSchemaSetupRunner`, in one transaction behind an advisory
 *    lock) on a container built the way a request's is (`ApiRequestRegistration`), so it creates
 *    every table the storage and the project's modules use, and the API runs schema-managed;
 * 2. sets `idle_session_timeout` on the database user (`WEBINY_PG_IDLE_SESSION_TIMEOUT_MS`, default
 *    10 minutes, 0 = off), so connections left open by old function copies after a deploy close;
 * 3. stores the service manifests it is given, where service discovery reads them. The api deploy
 *    passes `core`, `api` and `scheduler`; the admin deploy passes `admin` alone.
 *
 * The manifest writer and its table manager are built per call: they work on the connection this
 * call opens and closes.
 */
class SqlSchemaSetupServiceImpl implements SqlSchemaSetupService.Interface {
    public constructor(
        private readonly runner: SqlSchemaSetupRunner.Interface,
        private readonly request: ApiRequestRegistration.Interface,
        private readonly connection: SqlSchemaSetupConnection.Interface,
        private readonly schemaConfig: SqlSchemaConfig.Interface
    ) {}

    public async setup({ serviceManifests }: SqlSchemaSetupService.Params): Promise<string[]> {
        // Read before connecting, so a bad setting fails without touching the database.
        const idleSessionTimeoutMs = readIdleSessionTimeoutMs();

        const knex = this.connection.open();
        try {
            const done = await this.runner.run({ request: this.request, knex });

            // A role default: it applies to new sessions of this user. ALTER ROLE takes no
            // bindings; the value is a checked integer.
            await knex.raw(
                `ALTER ROLE CURRENT_USER SET idle_session_timeout = ${idleSessionTimeoutMs}`
            );
            done.push(`idle_session_timeout ${idleSessionTimeoutMs} ms`);

            if (serviceManifests.length) {
                const tableManager = new TableManager(knex, this.schemaConfig.tableNamePrefix);
                await new SqlServiceManifestWriter(knex, tableManager).write(serviceManifests);
                done.push(
                    `service manifests: ${serviceManifests.map(item => item.name).join(", ")}`
                );
            }

            return done;
        } finally {
            await knex.destroy();
        }
    }
}

export const SqlSchemaSetupServiceImplementation = SqlSchemaSetupService.createImplementation({
    implementation: SqlSchemaSetupServiceImpl,
    dependencies: [
        SqlSchemaSetupRunner,
        ApiRequestRegistration,
        SqlSchemaSetupConnection,
        SqlSchemaConfig
    ]
});
