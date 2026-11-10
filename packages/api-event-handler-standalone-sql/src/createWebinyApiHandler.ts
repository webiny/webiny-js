/**
 * Webiny API handler for the standalone Node server transport on a SQL storage.
 *
 * Thin variant over the transport base (@webiny/api-event-handler-standalone): takes the storage
 * (`createSqliteStorage` from @webiny/api-storage-sqlite, or `createPgStorage` from
 * @webiny/api-storage-pg, each built from its connection) and adds the self-hosted identity provider
 * (JWT IdP + SQL credential storage) on the storage's connection.
 *
 * At start, before the server accepts a request, it sets up the storage's schema (with the project's
 * extensions, so the modules among them set up theirs), then registers the storage schema-managed:
 * no request checks for or creates tables. The JWT signing secret is read from
 * `WEBINY_SELF_HOSTED_AUTH_SECRET` when the handler is created.
 */
import { KnexClient, type SqlStorage } from "@webiny/api-core-sql";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import {
    createWebinyApiHandler as createBaseHandler,
    type CreateWebinyApiHandlerConfig as BaseConfig
} from "@webiny/api-event-handler-standalone";
import { SelfHostedAuthApiFeature } from "@webiny/self-hosted-auth";
import { SelfHostedAuthSqlFeature } from "@webiny/self-hosted-auth-sql";
import { readSigningSecret } from "~/readSigningSecret.js";

export type CreateSqlApiHandlerConfig = Pick<BaseConfig, "extensions"> & {
    /** The SQL storage of the API, built from its connection. */
    storage: SqlStorage;
};

export function createSqlApiHandler(config: CreateSqlApiHandlerConfig) {
    const { storage } = config;
    // Read once, so a missing secret stops the server at boot instead of failing the first login.
    const signingSecret = readSigningSecret(process.env);

    /*
     * Self-hosted auth keeps its tables on the storage's connection, so the storage's setup creates
     * them too: in the setup's container, on the connection the setup runs on (`KnexClient`, a
     * transaction on Postgres).
     */
    const selfHostedAuthSchema = createRegisterExtensionPlugin(({ container }) => {
        SelfHostedAuthSqlFeature.register(container, {
            knex: container.resolve(KnexClient).client,
            tableNamePrefix: storage.tableNamePrefix
        });
    });

    return createBaseHandler({
        extensions: config.extensions,
        registerRootStorage: async container => {
            // Before the server takes traffic: `root` runs before the server is handed back to
            // listen. A failure (a missing module, a database that's down) stops the server here.
            await storage.setupSchema([config.extensions(), selfHostedAuthSchema]);
            await storage.register(container);

            // Identity provider: the self-hosted JWT IdP + its SQL credential storage. Registered in
            // the root so the RequestIdentityLoader (driven by NodeHttpIdentityLoaderDecorator) can
            // resolve it. SelfHostedAuthSqlFeature supplies the credential storage operations over Knex.
            SelfHostedAuthSqlFeature.register(container, {
                knex: storage.knex,
                tableNamePrefix: storage.tableNamePrefix,
                // Its tables were set up with the storage's, above.
                schemaManaged: true
            });
            SelfHostedAuthApiFeature.register(container, { signingSecret });
        }
    });
}
