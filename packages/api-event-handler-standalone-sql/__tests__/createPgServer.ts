import type { AddressInfo } from "node:net";
import os from "node:os";
import nodePath from "node:path";
import knexLib, { type Knex } from "knex";
import { vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { createRegisterBuildParamPlugin, createRegisterExtensionPlugin } from "@webiny/handler";
import { BuildParam } from "@webiny/api-core/features/buildParams/abstractions.js";
import { createPgStorage } from "@webiny/api-storage-pg";
import { HeadlessCmsPgExtension } from "@webiny/api-headless-cms-pg";
import { AcoPgExtension } from "@webiny/api-aco-pg";
import { createSqlApiHandler } from "~/createWebinyApiHandler.js";

class SigningSecretBuildParam implements BuildParam.Interface {
    key = "SelfHostedAuthSigningSecret";
    value = "test-signing-secret";
}

const SigningSecret = BuildParam.createImplementation({
    implementation: SigningSecretBuildParam,
    dependencies: []
});

// Mirrors what `<SelfHostedAuth signingSecret>` generates into `extensions.ts`.
export const signingSecret = createRegisterBuildParamPlugin(ctx => {
    ctx.container.register(SigningSecret);
});

// Mirror what `<HeadlessCmsPg />` and `<AcoPg />` generate into `extensions.ts`.
export const headlessCmsPg = createRegisterExtensionPlugin(ctx => {
    HeadlessCmsPgExtension.register(ctx.container);
});
export const acoPg = createRegisterExtensionPlugin(ctx => {
    AcoPgExtension.register(ctx.container);
});

export interface GraphQLResult {
    statusCode: number;
    raw: string;
    // The tests read into the response by path, so the body is left untyped.
    body: any;
}

/** DDL: what a schema-managed server must never run after it started. */
const DDL = /^\s*(create|alter|drop|comment)\s/i;

export interface CreatePgServerOptions {
    /** The project's extensions. Default: the signing secret and the Postgres CMS and ACO modules. */
    extensions?: unknown[];
}

/**
 * Boots the full standalone server on the Postgres storage, against a fresh in-memory Postgres
 * (PGlite, as `<Infra.Pglite>` runs it: over the wire protocol, one connection), and returns a
 * function that sends one GraphQL request to it, the Knex client for checking what was stored, the
 * DDL the server ran since it started (`ddlAfterStart`), and a `close` to shut everything down.
 */
export const createPgServer = async (options: CreatePgServerOptions = {}) => {
    const extensions = options.extensions ?? [signingSecret, headlessCmsPg, acoPg];

    const db = await PGlite.create();
    const socketServer = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
    await socketServer.start();

    // As `createPgConnection` builds it for `<Infra.Pglite>` (WEBINY_PG_POOL_MAX=1).
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

    const stopDatabase = async () => {
        await knex.destroy();
        await socketServer.stop();
        await db.close();
        vi.unstubAllEnvs();
    };

    let started = false;
    const statementsAfterStart: string[] = [];
    knex.on("query", (query: { sql: string }) => {
        if (started) {
            statementsAfterStart.push(query.sql);
        }
    });

    /*
     * One process has one database: the storage's process-wide memory (which tables exist, CMS
     * scopes) is from an earlier test's database, so forget it, as the SQL test setups do between
     * tests.
     */
    const managers = ((globalThis as Record<string, unknown>).__sqlTableManagers ?? []) as {
        reset(): void;
    }[];
    managers.forEach(manager => manager.reset());

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

    let server: Awaited<ReturnType<typeof createSqlApiHandler>>;
    try {
        server = await createSqlApiHandler({
            extensions: () => extensions,
            storage: createPgStorage({ knex })
        });
    } catch (error) {
        await stopDatabase();
        throw error;
    } finally {
        vi.useRealTimers();
    }
    started = true;

    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;

    const graphql = async (
        query: string,
        variables: Record<string, unknown> = {},
        token?: string,
        path = "/graphql"
    ): Promise<GraphQLResult> => {
        const headers: Record<string, string> = {
            "content-type": "application/json",
            "x-tenant": "root"
        };
        if (token) {
            headers["authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`http://127.0.0.1:${port}${path}`, {
            method: "POST",
            headers,
            body: JSON.stringify({ query, variables })
        });
        const raw = await response.text();

        return { statusCode: response.status, raw, body: JSON.parse(raw) };
    };

    const ddlAfterStart = () => statementsAfterStart.filter(sql => DDL.test(sql));

    const close = async () => {
        server.closeAllConnections();
        await new Promise<void>(resolve => server.close(() => resolve()));
        await stopDatabase();
    };

    return { graphql, knex, ddlAfterStart, close };
};
