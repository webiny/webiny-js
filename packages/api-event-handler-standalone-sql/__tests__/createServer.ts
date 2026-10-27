import type { AddressInfo } from "node:net";
import os from "node:os";
import nodePath from "node:path";
import type { Knex } from "knex";
import { vi } from "vitest";
import { createSqlApiHandler } from "~/createWebinyApiHandler.js";
import type { CreateSqlApiHandlerConfig } from "~/createWebinyApiHandler.js";

declare global {
    /**
     * Set by the SQL storage test presets (@webiny/api-headless-cms-sql): SQLite in memory, or PGlite
     * when WEBINY_SQL_CLIENT=pglite.
     */
    var __testKnex: Knex;
}

export interface GraphQLResult {
    statusCode: number;
    raw: string;
    // The tests read into the response by path, so the body is left untyped.
    body: any;
}

/**
 * Boots the full standalone SQL server on a random local port and returns a function that sends one
 * GraphQL request to it, plus a `close` to shut it down.
 */
export const createServer = async (
    extensions: CreateSqlApiHandlerConfig["extensions"] = () => [],
    /** Env overrides, applied after the defaults below, e.g. a blank value to test a missing one. */
    env: Record<string, string> = {}
) => {
    /**
     * On start, the server arms in-process timers (the scheduler's recovery run and the periodic
     * empty-trash-bin trigger) that call back into it over HTTP. Faking the timers while it starts
     * keeps them from ever firing, so nothing calls the server after a test has closed it.
     */
    vi.useFakeTimers({ toFake: ["setTimeout", "setInterval"] });

    // What `<Infra.ApiUrl>`, `<Infra.FileStorage>`, `<Infra.Crypto.*>` and `<SelfHostedAuth>` put
    // in the env of `webiny watch`. The server reads them at startup and refuses to boot without them.
    vi.stubEnv("WEBINY_API_URL", "http://localhost:3002");
    const tmpDir = os.tmpdir();
    const storagePath = nodePath.join(tmpDir, "webiny-standalone-sql-tests");
    vi.stubEnv("WEBINY_LOCAL_STORAGE_PATH", storagePath);
    vi.stubEnv("WEBINY_UPLOAD_SECRET", "test-upload-secret");
    vi.stubEnv("WEBINY_SELF_HOSTED_AUTH_SECRET", "test-signing-secret");
    vi.stubEnv("WEBINY_ENCRYPTION_PASSPHRASE", "test-encryption-passphrase");
    vi.stubEnv("WEBINY_HASHING_PEPPER", "test-hashing-pepper");
    for (const [name, value] of Object.entries(env)) {
        vi.stubEnv(name, value);
    }

    const server = await createSqlApiHandler({
        extensions,
        knex: globalThis.__testKnex
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

        const body = JSON.stringify({ query, variables });
        const response = await fetch(`http://127.0.0.1:${port}/graphql`, {
            method: "POST",
            headers,
            body
        });
        const raw = await response.text();

        return { statusCode: response.status, raw, body: JSON.parse(raw) };
    };

    const close = async () => {
        server.closeAllConnections();
        await new Promise<void>(resolve => server.close(() => resolve()));
    };

    return { graphql, close };
};
