import { ApiRequestRegistration } from "@webiny/api-event-handler-core";
import {
    SqlSchemaConfig,
    SqlSchemaSetupRunner,
    SqlServiceManifestWriter,
    TableManager
} from "@webiny/api-core-sql";
import { SqlSchemaSetupConnection, SqlSchemaSetupService } from "./abstractions.js";
import { waitForApiConnection } from "./waitForApiConnection.js";

/** Postgres closes a session of the API's user after it has been idle this long, by default. */
const DEFAULT_IDLE_SESSION_TIMEOUT_MS = 600_000;

/**
 * How long the setup waits, by default, for the API's connection to be accepted when the API
 * connects elsewhere than the setup (RDS Proxy). A new proxy took about 6 minutes after its target
 * registered. The function's timeout (15 minutes) leaves time for the setup itself.
 */
const DEFAULT_API_WAIT_MS = 600_000;

/**
 * Time kept, at the end of the function's, for the wait's last attempt to close its connection and
 * for the setup to return its error. A first deploy's table creation and a 10-minute wait can
 * together take longer than the function may run; the wait then ends this long before the function
 * would be stopped, so the deploy fails with the error that says what to check, not with a timeout.
 */
const RESERVED_AFTER_WAIT_MS = 30_000;

/**
 * The `WEBINY_PG_*` settings below are set on the function by the deployment, next to the
 * connection settings the Lambda connection reads. They are read from the environment, not from
 * `BuildParams`: those are registered in a request's container, and this service runs in the root.
 */
const readMsSetting = (name: string, defaultMs: number): number => {
    const value = process.env[name];
    if (value === undefined || value === "") {
        return defaultMs;
    }
    const ms = Number(value);
    if (!Number.isInteger(ms) || ms < 0) {
        throw new Error(
            `${name} must be a whole number of milliseconds (0 turns it off), not "${value}".`
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
 * 4. when the API connects elsewhere (RDS Proxy, `SqlSchemaSetupConnection.openApi`), closes its own
 *    connection and waits until the API's is accepted (`WEBINY_PG_API_WAIT_MS`, default 10 minutes,
 *    0 = don't wait), so the deploy fails rather than finishing with an API that can't connect.
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

    public async setup({
        serviceManifests,
        deadline
    }: SqlSchemaSetupService.Params): Promise<string[]> {
        // Read before connecting, so a bad setting fails without touching the database.
        const idleSessionTimeoutMs = readMsSetting(
            "WEBINY_PG_IDLE_SESSION_TIMEOUT_MS",
            DEFAULT_IDLE_SESSION_TIMEOUT_MS
        );
        const apiWaitMs = readMsSetting("WEBINY_PG_API_WAIT_MS", DEFAULT_API_WAIT_MS);

        const done = await this.setupOnWriter(serviceManifests, idleSessionTimeoutMs);

        // After the writer's connection is closed: one connection at a time.
        const openApi = this.connection.openApi?.bind(this.connection);
        if (openApi && apiWaitMs > 0) {
            const waitMs =
                deadline === undefined
                    ? apiWaitMs
                    : Math.max(
                          Math.min(apiWaitMs, deadline - RESERVED_AFTER_WAIT_MS - Date.now()),
                          0
                      );
            done.push(await waitForApiConnection({ open: openApi, waitMs }));
        }

        return done;
    }

    private async setupOnWriter(
        serviceManifests: SqlSchemaSetupService.Params["serviceManifests"],
        idleSessionTimeoutMs: number
    ): Promise<string[]> {
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
