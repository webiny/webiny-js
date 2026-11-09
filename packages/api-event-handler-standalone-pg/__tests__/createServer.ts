import type { AddressInfo } from "node:net";
import os from "node:os";
import nodePath from "node:path";
import knexLib, { type Knex } from "knex";
import { vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { createRegisterBuildParamPlugin } from "@webiny/handler";
import { BuildParam } from "@webiny/api-core/features/buildParams/abstractions.js";
import { createPgApiHandler } from "~/index.js";

class SigningSecretBuildParam implements BuildParam.Interface {
    key = "SelfHostedAuthSigningSecret";
    value = "test-signing-secret";
}

const SigningSecret = BuildParam.createImplementation({
    implementation: SigningSecretBuildParam,
    dependencies: []
});

// Mirrors what `<SelfHostedAuth signingSecret>` generates into `extensions.ts`.
const signingSecret = createRegisterBuildParamPlugin(ctx => {
    ctx.container.register(SigningSecret);
});

export interface GraphQLResult {
    statusCode: number;
    raw: string;
    // The tests read into the response by path, so the body is left untyped.
    body: any;
}

/**
 * Boots the full standalone server on the Postgres-native storage, against a fresh in-memory
 * Postgres (PGlite, as `<Infra.LocalPostgres>` runs it: over the wire protocol, one connection),
 * and returns a function that sends one GraphQL request to it, the Knex client for checking what
 * was stored, and a `close` to shut everything down.
 */
export const createServer = async () => {
    const db = await PGlite.create();
    const socketServer = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
    await socketServer.start();

    // As `createPostgresConnection` builds it for `<Infra.LocalPostgres>` (WEBINY_PG_POOL_MAX=1).
    const knex: Knex = knexLib({
        client: "pg",
        connection: {
            host: "127.0.0.1",
            port: (socketServer as unknown as { port: number }).port,
            user: "postgres",
            password: "postgres",
            database: "postgres"
        },
        pool: { min: 1, max: 1 }
    });

    /*
     * On start, the server arms in-process timers (the scheduler's recovery run and the periodic
     * empty-trash-bin trigger) that call back into it over HTTP. Faking the timers while it starts
     * keeps them from ever firing, so nothing calls the server after a test has closed it.
     */
    vi.useFakeTimers({ toFake: ["setTimeout", "setInterval"] });

    // What `<Infra.ApiUrl>` and `<Infra.FileStorage>` put in the env of `webiny watch`.
    vi.stubEnv("WEBINY_API_URL", "http://localhost:3002");
    vi.stubEnv(
        "WEBINY_LOCAL_STORAGE_PATH",
        nodePath.join(os.tmpdir(), "webiny-standalone-pg-tests")
    );
    vi.stubEnv("WEBINY_UPLOAD_SECRET", "test-upload-secret");
    vi.stubEnv("WEBINY_SELF_HOSTED_AUTH_SECRET", "test-signing-secret");
    vi.stubEnv("WEBINY_ENCRYPTION_PASSPHRASE", "test-encryption-passphrase");
    vi.stubEnv("WEBINY_HASHING_PEPPER", "test-hashing-pepper");

    const server = await createPgApiHandler({
        extensions: () => [signingSecret],
        knex
    }).finally(() => {
        vi.useRealTimers();
    });

    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;

    const graphql = async (
        query: string,
        variables: Record<string, unknown> = {},
        token?: string
    ): Promise<GraphQLResult> => {
        const headers: Record<string, string> = {
            "content-type": "application/json",
            "x-tenant": "root"
        };
        if (token) {
            headers["authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`http://127.0.0.1:${port}/graphql`, {
            method: "POST",
            headers,
            body: JSON.stringify({ query, variables })
        });
        const raw = await response.text();

        return { statusCode: response.status, raw, body: JSON.parse(raw) };
    };

    const close = async () => {
        server.closeAllConnections();
        await new Promise<void>(resolve => server.close(() => resolve()));
        await knex.destroy();
        await socketServer.stop();
        await db.close();
        vi.unstubAllEnvs();
    };

    return { graphql, knex, close };
};
