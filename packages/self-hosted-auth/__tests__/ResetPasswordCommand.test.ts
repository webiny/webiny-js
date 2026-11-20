import { afterEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/feature/api";
import {
    CliCommandFactory,
    GetProjectSdkService,
    UiService
} from "@webiny/cli-core/abstractions/index.js";
import resetPasswordCommand from "~/cli/ResetPasswordCommand.js";
import { verifyCliResetToken } from "~/shared/cliResetToken.js";

const PASSWORD = "long-enough-password";

// Both prompts (password, then confirmation) answer the same, so they match.
vi.mock("inquirer", () => ({
    default: {
        createPromptModule: () => async (question: { name: string }) => ({
            [question.name]: PASSWORD
        })
    }
}));

/**
 * The command reads `WEBINY_SELF_HOSTED_AUTH_SECRET` and `WEBINY_API_URL` from the environment,
 * after loading the project has copied webiny.config's values into it. Both are emptied first, so
 * the suite doesn't depend on what the machine running it has set, then set from `env`.
 */
const setup = (env: Record<string, string>) => {
    vi.stubEnv("WEBINY_SELF_HOSTED_AUTH_SECRET", "");
    vi.stubEnv("WEBINY_API_URL", "");
    for (const [name, value] of Object.entries(env)) {
        vi.stubEnv(name, value);
    }

    const container = new Container();

    container.registerInstance(GetProjectSdkService, {
        execute: async () => ({})
    } as never);

    container.registerInstance(UiService, {
        raw: vi.fn(),
        text: vi.fn(),
        textBold: vi.fn(),
        emptyLine: vi.fn(),
        info: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        debug: vi.fn()
    });

    container.register(resetPasswordCommand);

    return container.resolve(CliCommandFactory);
};

/**
 * The checks the command makes before it prompts for anything. Each exists so a misconfiguration
 * fails with an explanation, rather than letting the operator type a password into a dead end.
 */
describe("reset-password command", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("takes the email as a required parameter and the API URL as an option", async () => {
        const definition = await setup({}).execute();

        expect(definition.name).toBe("reset-password");
        expect(definition.params).toEqual([
            expect.objectContaining({ name: "email", required: true })
        ]);
        expect(definition.options).toEqual([
            expect.objectContaining({ name: "api-url" }),
            expect.objectContaining({ name: "signing-secret" })
        ]);
    });

    /**
     * There is deliberately no "refuses when the flag is off" case. `<SelfHostedAuth>` does not
     * render the `Cli/Command` extension when the flag is off, so the command does not exist to be
     * invoked, and a handler-level guard would be unreachable. An earlier version had both, and the
     * test passed only because it registered the command by hand.
     */
    it("has no guard for the cliPasswordReset flag, since a disabled project has no command", async () => {
        const definition = await setup({
            WEBINY_SELF_HOSTED_AUTH_SECRET: "s3cret",
            WEBINY_API_URL: "http://localhost:3002"
        }).execute();

        // Gets as far as the prompt and the request, rather than refusing on the flag.
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new Error("ECONNREFUSED");
            })
        );

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /Could not reach the API/
        );

        vi.unstubAllGlobals();
    });

    it("lists every route to a signing secret when it has none", async () => {
        const definition = await setup({}).execute();

        await expect(
            definition.handler({ email: "admin@example.com", apiUrl: "http://localhost:3002" })
        ).rejects.toThrow(
            /Set \$WEBINY_SELF_HOSTED_AUTH_SECRET.*<SelfHostedAuth signingSecret.*--signing-secret/s
        );
    });

    it("points at the API URL config when there is nothing to call", async () => {
        const definition = await setup({ WEBINY_SELF_HOSTED_AUTH_SECRET: "s3cret" }).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /No API URL configured/
        );
    });
});

describe("reset-password command, talking to an API", () => {
    const SECRET = "s3cret";
    const configured = {
        WEBINY_SELF_HOSTED_AUTH_SECRET: SECRET,
        WEBINY_API_URL: "http://localhost:3002/"
    };

    const respondWith = (body: unknown, ok = true) => {
        const fetchMock = vi.fn(async () => ({
            ok,
            status: ok ? 200 : 500,
            json: async () => body
        }));

        vi.stubGlobal("fetch", fetchMock);

        return fetchMock;
    };

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.useRealTimers();
    });

    it("posts a token the API side can verify, to the configured origin", async () => {
        const fetchMock = respondWith({
            data: { selfHostedAuthCliResetPassword: { data: true, error: null } }
        });

        const definition = await setup(configured).execute();
        await definition.handler({ email: "admin@example.com" });

        // Trailing slash stripped, /graphql appended.
        expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3002/graphql");

        const sent = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);

        expect(sent.variables.password).toBe(PASSWORD);
        // The point of the check: what the CLI signs is what the API's verifier accepts.
        expect(verifyCliResetToken({ secret: SECRET, token: sent.variables.token })).toEqual({
            email: "admin@example.com"
        });
    });

    /**
     * An API built with the flag off has no such field, so GraphQL rejects it during validation
     * and it arrives as a schema error. The raw "Cannot query field" text explains nothing.
     */
    it("recognises an API built with CLI password reset disabled", async () => {
        respondWith({
            errors: [
                {
                    message:
                        'Cannot query field "selfHostedAuthCliResetPassword" on type "Mutation".'
                }
            ]
        });

        const definition = await setup(configured).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /built with CLI password reset disabled/
        );
    });

    it("passes through any other GraphQL error", async () => {
        respondWith({ errors: [{ message: "Something else went wrong." }] });

        const definition = await setup(configured).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /Something else went wrong/
        );
    });

    it("names the likely cause when the API refuses the token", async () => {
        respondWith({
            data: {
                selfHostedAuthCliResetPassword: {
                    data: null,
                    error: {
                        code: "INVALID_RESET_TOKEN",
                        message: "The password reset token is invalid or has expired."
                    }
                }
            }
        });

        const definition = await setup(configured).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /signing secret mismatch/
        );
    });

    it("reports other API errors as they come", async () => {
        respondWith({
            data: {
                selfHostedAuthCliResetPassword: {
                    data: null,
                    error: {
                        code: "CREDENTIAL_NOT_FOUND_FOR_EMAIL",
                        message: 'No credential found for "admin@example.com".'
                    }
                }
            }
        });

        const definition = await setup(configured).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /No credential found for "admin@example.com"\. \(CREDENTIAL_NOT_FOUND_FOR_EMAIL\)/
        );
    });

    /**
     * The point of the overrides: reach an instance the local config knows nothing about, with its
     * secret supplied from a secret manager rather than the repo.
     */
    it("signs with --signing-secret when the environment has no secret", async () => {
        const fetchMock = respondWith({
            data: { selfHostedAuthCliResetPassword: { data: true, error: null } }
        });

        const definition = await setup({}).execute();
        await definition.handler({
            email: "admin@example.com",
            apiUrl: "https://api.example.com",
            signingSecret: "prod-secret"
        });

        expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/graphql");

        const sent = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);

        expect(verifyCliResetToken({ secret: "prod-secret", token: sent.variables.token })).toEqual(
            {
                email: "admin@example.com"
            }
        );
        expect(verifyCliResetToken({ secret: SECRET, token: sent.variables.token })).toBeNull();
    });

    it("prefers --signing-secret over $WEBINY_SELF_HOSTED_AUTH_SECRET", async () => {
        const fetchMock = respondWith({
            data: { selfHostedAuthCliResetPassword: { data: true, error: null } }
        });

        const definition = await setup(configured).execute();
        await definition.handler({ email: "admin@example.com", signingSecret: "override" });

        const sent = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);

        expect(verifyCliResetToken({ secret: "override", token: sent.variables.token })).toEqual({
            email: "admin@example.com"
        });
    });

    /**
     * The failure this guards against is silent: an API that accepts the connection and then goes
     * quiet leaves the operator staring at a cursor, with no way to tell whether the password was
     * changed. Node's fetch waits forever on its own.
     */
    it("gives up on an API that never answers", async () => {
        vi.useFakeTimers();

        let signal: AbortSignal | undefined;

        const fetchMock = vi.fn((_url: string, init: { signal: AbortSignal }) => {
            signal = init.signal;

            // Settles only when the command aborts it, like a connection that is open but idle.
            return new Promise((_resolve, reject) => {
                init.signal.addEventListener("abort", () =>
                    reject(new Error("This operation was aborted"))
                );
            });
        });

        vi.stubGlobal("fetch", fetchMock);

        const definition = await setup(configured).execute();

        const run = definition.handler({ email: "admin@example.com" });
        // Attached before the clock moves, so the rejection is never momentarily unhandled.
        const rejects = expect(run).rejects.toThrow(/Could not reach the API/);

        // Lets the prompts resolve and the request go out, without advancing the deadline.
        await vi.advanceTimersByTimeAsync(0);
        expect(signal?.aborted).toBe(false);

        // Comfortably past API_TIMEOUT_MS, so the test does not pin the exact duration.
        await vi.advanceTimersByTimeAsync(120_000);

        await rejects;
        expect(signal?.aborted).toBe(true);
    });

    it("says the API is unreachable rather than surfacing a raw fetch failure", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new Error("ECONNREFUSED");
            })
        );

        const definition = await setup(configured).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /Could not reach the API at http:\/\/localhost:3002\/graphql/
        );
    });
});
