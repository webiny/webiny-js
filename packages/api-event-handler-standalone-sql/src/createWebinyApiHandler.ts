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
import type { Container } from "@webiny/di";
import { RequestStorage } from "@webiny/api-core";
import type { SqlStorage } from "@webiny/api-core-sql";
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

/*
 * The login storage of a request: the credentials and reset codes, on the storage's connection and
 * table settings (`KnexClient`, `SqlSchemaConfig`, in the root).
 */
const SelfHostedAuthRequestStorage: RequestStorage.Interface = {
    register(container) {
        SelfHostedAuthSqlFeature.register(container);
    }
};

/*
 * Self-hosted auth keeps its tables on the storage's connection, so the storage's setup creates them
 * too: its storage, with its schema setup step, in the setup's container.
 */
const selfHostedAuthSchema = createRegisterExtensionPlugin(({ container }) => {
    SelfHostedAuthSqlFeature.register(container);
});

/**
 * What the handler puts in the root container, once per process, after the schema is set up: the
 * storage (the connection and its settings, and its `RequestStorage`), the login storage's
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
            // Before the server takes traffic: `root` runs before the server is handed back to
            // listen. A failure (a missing module, a database that's down) stops the server here.
            await storage.setupSchema([config.extensions(), selfHostedAuthSchema]);
            registerSqlApiRoot(container, { storage, signingSecret });
        }
    });
}
