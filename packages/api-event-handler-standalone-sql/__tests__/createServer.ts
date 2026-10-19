import type { AddressInfo } from "node:net";
import type { Knex } from "knex";
import { vi } from "vitest";
import { createRegisterBuildParamPlugin } from "@webiny/handler";
import { BuildParam } from "@webiny/api-core/features/buildParams/abstractions.js";
import { createSqlApiHandler } from "~/createWebinyApiHandler.js";
import type { CreateSqlApiHandlerConfig } from "~/createWebinyApiHandler.js";

declare global {
    /**
     * Set by the SQL storage test presets (@webiny/api-headless-cms-sql): SQLite in memory, or PGlite
     * when WEBINY_SQL_CLIENT=pglite.
     */
    var __testKnex: Knex;
}

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
 * Boots the full standalone SQL server on a random local port and returns a function that sends one
 * GraphQL request to it, plus a `close` to shut it down.
 */
export const createServer = async (
    extensions: CreateSqlApiHandlerConfig["extensions"] = () => []
) => {
    /**
     * On start, the server arms in-process timers (the scheduler's recovery run and the periodic
     * empty-trash-bin trigger) that call back into it over HTTP. Faking the timers while it starts
     * keeps them from ever firing, so nothing calls the server after a test has closed it.
     */
    vi.useFakeTimers({ toFake: ["setTimeout", "setInterval"] });
    const server = await createSqlApiHandler({
        extensions: () => [signingSecret, extensions()],
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
