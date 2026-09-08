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
 * Covers the checks the command makes before it prompts for anything. Each of them exists to fail
 * with an explanation rather than let the operator type a password into a dead end.
 */

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

const authExtension = (params: Record<string, unknown>) => ({
    "Project/SelfHostedAuth": [{ params }]
});

describe("reset-password command", () => {
    it("takes the email as a required parameter and the API URL as an option", async () => {
        const definition = await setup({}).execute();

        expect(definition.name).toBe("reset-password");
        expect(definition.params).toEqual([
            expect.objectContaining({ name: "email", required: true })
        ]);
        expect(definition.options).toEqual([expect.objectContaining({ name: "api-url" })]);
    });

    it("explains itself when self-hosted auth is not configured at all", async () => {
        const definition = await setup({}).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /Self-hosted auth is not configured/
        );
    });

    it("refuses up front when the project turned the escape hatch off", async () => {
        const definition = await setup(
            authExtension({ signingSecret: "s3cret", cliPasswordReset: false })
        ).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /CLI password reset is disabled/
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
    const configured = {
        ...authExtension({ signingSecret: SECRET }),
        "Infra/ApiUrl": [{ params: { url: "http://localhost:3002/" } }]
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
