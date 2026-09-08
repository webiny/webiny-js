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

interface ExtensionStub {
    params: unknown;
}

const setup = (extensions: Record<string, ExtensionStub[]>) => {
    const container = new Container();

    const projectConfig = {
        extensionsByType: (type: string) => extensions[type] ?? []
    };

    container.registerInstance(GetProjectSdkService, {
        execute: async () => ({ getProjectConfig: async () => projectConfig })
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
 * The command reads API build params, not the extensions that emit them, because only registered
 * extension definitions survive `hydrateConfig` and neither `Project/SelfHostedAuth` nor
 * `Infra/ApiUrl` registers one. Building the stub the same way keeps these tests honest: an
 * earlier version stubbed `Project/SelfHostedAuth` and so passed while the real command could
 * never read anything.
 */
const buildParams = (params: Record<string, unknown>) => ({
    "Api/BuildParam": Object.entries(params).map(([paramName, value]) => ({
        params: { paramName, value }
    }))
});

const authExtension = (params: Record<string, unknown>) =>
    buildParams({
        ...(params.signingSecret ? { SelfHostedAuthSigningSecret: params.signingSecret } : {}),
        ...(params.cliPasswordReset !== undefined
            ? { SelfHostedAuthCliPasswordReset: params.cliPasswordReset }
            : {})
    });

/**
 * The checks the command makes before it prompts for anything. Each exists so a misconfiguration
 * fails with an explanation, rather than letting the operator type a password into a dead end.
 */
describe("reset-password command", () => {
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

    it("refuses up front when the project turned the escape hatch off", async () => {
        const definition = await setup(
            authExtension({ signingSecret: "s3cret", cliPasswordReset: false })
        ).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /CLI password reset is disabled/
        );
    });

    it("lists every route to a signing secret when it has none", async () => {
        const definition = await setup({}).execute();

        await expect(
            definition.handler({ email: "admin@example.com", apiUrl: "http://localhost:3002" })
        ).rejects.toThrow(
            /configure <SelfHostedAuth signingSecret.*WEBINY_SELF_HOSTED_SIGNING_SECRET.*--signing-secret/s
        );
    });

    it("points at the API URL config when there is nothing to call", async () => {
        const definition = await setup(authExtension({ signingSecret: "s3cret" })).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /No API URL configured/
        );
    });
});

describe("reset-password command, talking to an API", () => {
    const SECRET = "s3cret";
    const configured = buildParams({
        SelfHostedAuthSigningSecret: SECRET,
        WEBINY_API_URL: "http://localhost:3002/"
    });

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
    it("signs with --signing-secret when the project config has no auth extension at all", async () => {
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

    it("prefers --signing-secret over the project config", async () => {
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

    it("uses the env var when the project config supplies no secret", async () => {
        const fetchMock = respondWith({
            data: { selfHostedAuthCliResetPassword: { data: true, error: null } }
        });

        vi.stubEnv("WEBINY_SELF_HOSTED_SIGNING_SECRET", "from-env");

        const definition = await setup(
            buildParams({ WEBINY_API_URL: "https://api.example.com" })
        ).execute();
        await definition.handler({ email: "admin@example.com" });

        const sent = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);

        expect(verifyCliResetToken({ secret: "from-env", token: sent.variables.token })).toEqual({
            email: "admin@example.com"
        });
    });

    /**
     * The whole point of the env var. A developer's config resolves a local secret nearly always,
     * so if it outranked the env var, a production reset would be signed with the dev secret and
     * fail with nothing to go on.
     */
    it("prefers the env var over a project config that has its own secret", async () => {
        const fetchMock = respondWith({
            data: { selfHostedAuthCliResetPassword: { data: true, error: null } }
        });

        vi.stubEnv("WEBINY_SELF_HOSTED_SIGNING_SECRET", "prod-secret");

        const definition = await setup(configured).execute();
        await definition.handler({ email: "admin@example.com" });

        const sent = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);

        expect(verifyCliResetToken({ secret: "prod-secret", token: sent.variables.token })).toEqual(
            {
                email: "admin@example.com"
            }
        );
        expect(verifyCliResetToken({ secret: SECRET, token: sent.variables.token })).toBeNull();
    });

    it("still lets --signing-secret beat the env var", async () => {
        const fetchMock = respondWith({
            data: { selfHostedAuthCliResetPassword: { data: true, error: null } }
        });

        vi.stubEnv("WEBINY_SELF_HOSTED_SIGNING_SECRET", "from-env");

        const definition = await setup(configured).execute();
        await definition.handler({ email: "admin@example.com", signingSecret: "from-flag" });

        const sent = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);

        expect(verifyCliResetToken({ secret: "from-flag", token: sent.variables.token })).toEqual({
            email: "admin@example.com"
        });
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
