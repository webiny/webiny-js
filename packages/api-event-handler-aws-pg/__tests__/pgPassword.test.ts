import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
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
const { readPgPassword } = await import("~/connection/readPgPassword.js");

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

            // Three clients (the API's, and two migrations), each opening its own connections.
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
