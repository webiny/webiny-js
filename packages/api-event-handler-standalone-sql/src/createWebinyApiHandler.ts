/**
 * Webiny API handler for the standalone Node server transport on a SQL storage.
 *
 * Thin variant over the transport base (@webiny/api-event-handler-standalone): takes the storage
 * (`createSqliteStorage` from @webiny/api-storage-sqlite, or `createPgStorage` from
 * @webiny/api-storage-pg, each built from its connection) and adds the self-hosted identity provider
 * (JWT IdP + SQL credential storage) on the storage's connection.
 *
 * At start, before the server accepts a request, it runs the storage's schema setup
 * (`SqlSchemaSetupRunner`) on a container built the way a request's is, so the storage, the login
 * tables and the modules among the project's extensions set up theirs. Then the storage is
 * schema-managed: no request checks for or creates tables. The JWT signing secret is read from
 * `WEBINY_SELF_HOSTED_AUTH_SECRET` when the handler is created.
 */
import type { Container } from "@webiny/di";
import { RequestStorage } from "@webiny/api-core";
import { SqlSchemaSetupRunner, type SqlStorage } from "@webiny/api-core-sql";
import { ApiRequestRegistration } from "@webiny/api-event-handler-core";
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

/*
 * The login storage of a request: the credentials and reset codes, on the storage's connection and
 * table settings (`KnexClient`, `SqlSchemaConfig`, in the root).
 */
const SelfHostedAuthRequestStorage: RequestStorage.Interface = {
    register(container) {
        SelfHostedAuthSqlFeature.register(container);
    }
};

/**
 * What the handler puts in the root container, once per process: the storage (the connection and
 * its settings, its `RequestStorage` and its schema setup runner), the login storage's
 * `RequestStorage`, and the self-hosted JWT identity provider. The IdP is in the root so the
 * RequestIdentityLoader (driven by NodeHttpIdentityLoaderDecorator) can resolve it; it only needs the
 * token issuer, and the login use cases it registers resolve the credential storage from the
 * request's container.
 */
export function registerSqlApiRoot(
    container: Container,
    params: { storage: SqlStorage; signingSecret: string }
): void {
    params.storage.register(container);
    container.registerInstance(RequestStorage, SelfHostedAuthRequestStorage);
    SelfHostedAuthApiFeature.register(container, { signingSecret: params.signingSecret });
}

export function createSqlApiHandler(config: CreateSqlApiHandlerConfig) {
    const { storage } = config;
    // Read once, so a missing secret stops the server at boot instead of failing the first login.
    const signingSecret = readSigningSecret(process.env);

    return createBaseHandler({
        extensions: config.extensions,
        registerRootStorage: async container => {
            registerSqlApiRoot(container, { storage, signingSecret });
            /*
             * Before the server takes traffic: `root` runs before the server is handed back to
             * listen. The setup's container is built as a request's (`ApiRequestRegistration`), so
             * the login storage's `RequestStorage` adds the login tables. A failure (a missing
             * module, a database that's down) stops the server here.
             */
            await container.resolve(SqlSchemaSetupRunner).run({
                request: container.resolve(ApiRequestRegistration)
            });
        }
    });
}
