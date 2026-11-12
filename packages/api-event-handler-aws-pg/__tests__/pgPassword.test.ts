import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import knexFactory, { type Knex } from "knex";
import { startPglite } from "./startPglite.js";

/*
 * Secrets Manager, mocked: every `send` is recorded, and each test says what it answers.
 */
const secrets = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("@webiny/aws-sdk/client-secrets-manager/index.js", () => {
    class SecretsManagerClient {
        send = secrets.send;
    }
    class GetSecretValueCommand {
        constructor(public input: { SecretId: string }) {}
    }
    return { SecretsManagerClient, GetSecretValueCommand };
});

const { createLambdaPgConnection } = await import("~/connection/createLambdaPgConnection.js");
const { readPgPassword, PG_SECRET_TTL_MS } = await import("~/connection/readPgPassword.js");

const accessDenied = () =>
    Object.assign(new Error("not authorized"), { name: "AccessDeniedException" });

describe("the Postgres password on Lambda", () => {
    afterEach(() => {
        secrets.send.mockReset();
        vi.unstubAllEnvs();
        vi.useRealTimers();
    });

    describe("from WEBINY_PG_SECRET_ARN", () => {
        let pglite: Awaited<ReturnType<typeof startPglite>>;

        beforeAll(async () => {
            pglite = await startPglite();
        });

        afterAll(async () => {
            await pglite.stop();
        });

        it("is read once per environment, however many connections open", async () => {
            for (const [name, value] of Object.entries(pglite.env)) {
                vi.stubEnv(name, value);
            }
            vi.stubEnv("WEBINY_PG_SECRET_ARN", "arn:secret:once");
            secrets.send.mockResolvedValue({
                SecretString: JSON.stringify({ username: "postgres", password: "postgres" })
            });

            // Three clients (the API's, and two schema setups), each opening its own connections.
            for (let client = 0; client < 3; client++) {
                const knex = createLambdaPgConnection();
                for (let query = 0; query < 2; query++) {
                    const result = await knex.raw("select 1 as one");
                    expect(result.rows).toEqual([{ one: 1 }]);
                    // Drop the connection, so the next query opens a new one.
                    await knex.destroy();
                    knex.initialize();
                }
                await knex.destroy();
            }

            expect(secrets.send).toHaveBeenCalledTimes(1);
            expect(secrets.send.mock.calls[0][0].input).toEqual({ SecretId: "arn:secret:once" });
        });

        it("is read again on the next connection after the database refuses the login", async () => {
            for (const [name, value] of Object.entries(pglite.env)) {
                vi.stubEnv(name, value);
            }
            vi.stubEnv("WEBINY_PG_SECRET_ARN", "arn:secret:rotated");
            vi.stubEnv("WEBINY_PG_RETRY_MS", "0");
            secrets.send.mockResolvedValue({
                SecretString: JSON.stringify({ username: "postgres", password: "postgres" })
            });

            // PGlite takes any password: the pg client's login is refused once instead, as after a
            // rotation, with the error code Postgres sends for a wrong password.
            const probe = knexFactory({ client: "pg" });
            const pgClient = Object.getPrototypeOf(probe.client) as {
                acquireRawConnection(): Promise<unknown>;
            };
            await probe.destroy();
            const login = vi
                .spyOn(pgClient, "acquireRawConnection")
                .mockRejectedValueOnce(
                    Object.assign(new Error("password authentication failed"), { code: "28P01" })
                );

            const knex: Knex = createLambdaPgConnection();
            try {
                await expect(knex.raw("select 1 as one")).rejects.toThrow(
                    "password authentication failed"
                );
                expect(secrets.send).toHaveBeenCalledTimes(1);

                const result = await knex.raw("select 1 as one");
                expect(result.rows).toEqual([{ one: 1 }]);
                // The refused password was forgotten, so the next connection read the secret again.
                expect(secrets.send).toHaveBeenCalledTimes(2);
            } finally {
                login.mockRestore();
                await knex.destroy();
            }
        });

        it("takes the credentials from a connection string that has them", async () => {
            const { WEBINY_PG_HOST, WEBINY_PG_PORT } = pglite.env;
            vi.stubEnv(
                "WEBINY_PG_CONNECTION_STRING",
                `postgres://postgres:postgres@${WEBINY_PG_HOST}:${WEBINY_PG_PORT}/postgres` // gitleaks:allow
            );

            const knex = createLambdaPgConnection();
            try {
                const result = await knex.raw("select 1 as one");
                expect(result.rows).toEqual([{ one: 1 }]);
                // Neither WEBINY_PG_PASSWORD nor a secret was needed.
                expect(secrets.send).not.toHaveBeenCalled();
            } finally {
                await knex.destroy();
            }
        });

        it("takes the password from the connection string's query", async () => {
            const { WEBINY_PG_HOST, WEBINY_PG_PORT } = pglite.env;
            vi.stubEnv(
                "WEBINY_PG_CONNECTION_STRING",
                `postgres://postgres@${WEBINY_PG_HOST}:${WEBINY_PG_PORT}/postgres?password=postgres` // gitleaks:allow
            );

            const knex = createLambdaPgConnection();
            try {
                const result = await knex.raw("select 1 as one");
                expect(result.rows).toEqual([{ one: 1 }]);
                expect(secrets.send).not.toHaveBeenCalled();
            } finally {
                await knex.destroy();
            }
        });

        it("replaces a host in the connection string's query with the host option", async () => {
            const { WEBINY_PG_HOST, WEBINY_PG_PORT } = pglite.env;
            // node-postgres reads `?host=` over the URI's host, so the writer must replace that too.
            vi.stubEnv(
                "WEBINY_PG_CONNECTION_STRING",
                `postgres://postgres@unreachable.invalid:${WEBINY_PG_PORT}/postgres?host=unreachable.invalid`
            );
            vi.stubEnv("WEBINY_PG_PASSWORD", "postgres");

            const knex = createLambdaPgConnection({ host: WEBINY_PG_HOST });
            try {
                const result = await knex.raw("select 1 as one");
                expect(result.rows).toEqual([{ one: 1 }]);
            } finally {
                await knex.destroy();
            }
        });

        it("puts the host option and the secret's password into the connection string", async () => {
            const { WEBINY_PG_HOST, WEBINY_PG_PORT } = pglite.env;
            // The string names an address where nothing answers; the host option (the writer) wins.
            vi.stubEnv(
                "WEBINY_PG_CONNECTION_STRING",
                `postgres://postgres@unreachable.invalid:${WEBINY_PG_PORT}/postgres`
            );
            vi.stubEnv("WEBINY_PG_SECRET_ARN", "arn:secret:string-without-password");
            secrets.send.mockResolvedValue({
                SecretString: JSON.stringify({ username: "postgres", password: "p@ss/word" })
            });

            const knex = createLambdaPgConnection({ host: WEBINY_PG_HOST });
            try {
                const result = await knex.raw("select 1 as one");
                expect(result.rows).toEqual([{ one: 1 }]);
                expect(secrets.send).toHaveBeenCalledTimes(1);

                const settings = (knex.client as { connectionSettings: Knex.PgConnectionConfig })
                    .connectionSettings;
                const url = new URL(settings.connectionString as string);
                expect(url.hostname).toBe(WEBINY_PG_HOST);
                expect(decodeURIComponent(url.password)).toBe("p@ss/word");
            } finally {
                await knex.destroy();
            }
        });
    });

    it("reads the secret again once its password is PG_SECRET_TTL_MS old", async () => {
        vi.useFakeTimers();
        secrets.send.mockResolvedValue({ SecretString: JSON.stringify({ password: "pw" }) });
        const env = { WEBINY_PG_SECRET_ARN: "arn:secret:ttl" };

        await expect(readPgPassword(env)).resolves.toBe("pw");
        await vi.advanceTimersByTimeAsync(PG_SECRET_TTL_MS - 1);
        await expect(readPgPassword(env)).resolves.toBe("pw");
        expect(secrets.send).toHaveBeenCalledTimes(1);

        // Rotated meanwhile: the next read after the TTL gets the new password.
        secrets.send.mockResolvedValue({ SecretString: JSON.stringify({ password: "rotated" }) });
        await vi.advanceTimersByTimeAsync(1);
        await expect(readPgPassword(env)).resolves.toBe("rotated");
        expect(secrets.send).toHaveBeenCalledTimes(2);
    });

    it("uses WEBINY_PG_PASSWORD as is, without reading a secret", async () => {
        await expect(
            readPgPassword({
                WEBINY_PG_PASSWORD: "plain",
                WEBINY_PG_SECRET_ARN: "arn:secret:plain"
            })
        ).resolves.toBe("plain");

        expect(secrets.send).not.toHaveBeenCalled();
    });

    it("asks for a secret or a password when neither is set", async () => {
        await expect(readPgPassword({})).rejects.toThrow(
            "The Postgres password is not set: set WEBINY_PG_SECRET_ARN (a Secrets Manager secret) or WEBINY_PG_PASSWORD."
        );
    });

    it("retries an AccessDeniedException right after a deploy", async () => {
        vi.useFakeTimers();
        secrets.send
            .mockRejectedValueOnce(accessDenied())
            .mockRejectedValueOnce(accessDenied())
            .mockResolvedValueOnce({ SecretString: JSON.stringify({ password: "pw" }) });

        const password = readPgPassword({ WEBINY_PG_SECRET_ARN: "arn:secret:denied" });
        await vi.advanceTimersByTimeAsync(1_000 + 2_000);

        await expect(password).resolves.toBe("pw");
        expect(secrets.send).toHaveBeenCalledTimes(3);
    });

    it("gives up after five denied reads, and reads again on the next connection", async () => {
        vi.useFakeTimers();
        secrets.send.mockRejectedValue(accessDenied());

        const password = readPgPassword({ WEBINY_PG_SECRET_ARN: "arn:secret:gives-up" });
        const failed = expect(password).rejects.toThrow("not authorized");
        await vi.advanceTimersByTimeAsync(1_000 + 2_000 + 3_000 + 4_000);
        await failed;
        expect(secrets.send).toHaveBeenCalledTimes(5);

        // The failure isn't remembered: the next connection reads the secret again.
        secrets.send.mockReset();
        secrets.send.mockResolvedValue({ SecretString: JSON.stringify({ password: "pw" }) });
        await expect(readPgPassword({ WEBINY_PG_SECRET_ARN: "arn:secret:gives-up" })).resolves.toBe(
            "pw"
        );
    });

    it("doesn't retry other errors", async () => {
        secrets.send.mockRejectedValue(
            Object.assign(new Error("no such secret"), { name: "ResourceNotFoundException" })
        );

        await expect(
            readPgPassword({ WEBINY_PG_SECRET_ARN: "arn:secret:missing" })
        ).rejects.toThrow("no such secret");
        expect(secrets.send).toHaveBeenCalledTimes(1);
    });

    it("fails with a clear error when the secret has no password", async () => {
        secrets.send.mockResolvedValue({ SecretString: JSON.stringify({ username: "webiny" }) });

        await expect(
            readPgPassword({ WEBINY_PG_SECRET_ARN: "arn:secret:no-password" })
        ).rejects.toThrow("The Postgres secret arn:secret:no-password has no password.");
    });

    it("fails with a clear error when the secret isn't JSON", async () => {
        secrets.send.mockResolvedValue({ SecretString: "hunter2" });

        await expect(
            readPgPassword({ WEBINY_PG_SECRET_ARN: "arn:secret:not-json" })
        ).rejects.toThrow(
            'The Postgres secret arn:secret:not-json is not JSON. It must hold { "username", "password" }.'
        );
    });
});
