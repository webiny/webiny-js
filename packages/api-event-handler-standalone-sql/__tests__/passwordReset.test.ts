import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { PasswordResetMailer } from "@webiny/self-hosted-auth";
import { createServer } from "./createServer.js";

const INSTALL = /* GraphQL */ `
    mutation Install($installationInput: JSON!) {
        system {
            installSystem(installationInput: $installationInput) {
                data
            }
        }
    }
`;

const REQUEST_RESET = /* GraphQL */ `
    mutation RequestReset($email: String!) {
        selfHostedAuthRequestPasswordReset(email: $email) {
            data
            error {
                code
                message
            }
        }
    }
`;

const RESET = /* GraphQL */ `
    mutation Reset($email: String!, $code: String!, $password: String!) {
        selfHostedAuthResetPassword(email: $email, code: $code, password: $password) {
            data
            error {
                code
                message
            }
        }
    }
`;

const LOGIN = /* GraphQL */ `
    mutation Login($email: String!, $password: String!) {
        selfHostedAuthLogin(email: $email, password: $password) {
            data {
                token
            }
            error {
                code
            }
        }
    }
`;

const admin = {
    firstName: "Test",
    lastName: "Admin",
    email: "test-admin@example.com",
    password: "test-admin-password"
};

const waitFor = async (check: () => boolean, timeoutMs = 10_000) => {
    const until = Date.now() + timeoutMs;
    while (!check()) {
        if (Date.now() > until) {
            throw new Error("Timed out.");
        }
        await new Promise(resolve => setTimeout(resolve, 20));
    }
};

/*
 * The emailed reset, through the full standalone server: the request is anonymous and only starts
 * a background task, and the task mails the code. The mailer is replaced by one that records what it
 * would have sent, so no SMTP server is needed.
 */
describe("api-event-handler-standalone-sql — password reset by email", () => {
    it("mails a code from a background task, and the code resets the password", async () => {
        const sent: { email: string; code: string }[] = [];
        const mailer = createRegisterExtensionPlugin(({ container }) => {
            container.registerInstance(PasswordResetMailer, {
                isConfigured: async () => true,
                send: async params => {
                    sent.push(params);
                    return true;
                }
            });
        });

        const server = await createServer(() => [mailer]);

        try {
            const installationInput = [{ app: "SelfHostedAuth", data: admin }];
            await server.graphql(INSTALL, { installationInput });

            const requested = await server.graphql(REQUEST_RESET, { email: admin.email });
            expect(requested.body.data.selfHostedAuthRequestPasswordReset).toEqual({
                data: true,
                error: null
            });

            await waitFor(() => sent.length > 0);
            expect(sent).toEqual([{ email: admin.email, code: expect.stringMatching(/^\d{6}$/) }]);

            const reset = await server.graphql(RESET, {
                email: admin.email,
                code: sent[0]!.code,
                password: "a-new-password"
            });
            expect(reset.body.data.selfHostedAuthResetPassword).toEqual({
                data: true,
                error: null
            });

            const login = await server.graphql(LOGIN, {
                email: admin.email,
                password: "a-new-password"
            });
            expect(login.body.data.selfHostedAuthLogin.error).toBeNull();
        } finally {
            await server.close();
        }
    });

    it("answers an address with no account the same way, and mails nothing", async () => {
        const sent: unknown[] = [];
        const mailer = createRegisterExtensionPlugin(({ container }) => {
            container.registerInstance(PasswordResetMailer, {
                isConfigured: async () => true,
                send: async params => {
                    sent.push(params);
                    return true;
                }
            });
        });

        const server = await createServer(() => [mailer]);

        try {
            const installationInput = [{ app: "SelfHostedAuth", data: admin }];
            await server.graphql(INSTALL, { installationInput });

            const requested = await server.graphql(REQUEST_RESET, {
                email: "nobody@example.com"
            });
            expect(requested.body.data.selfHostedAuthRequestPasswordReset).toEqual({
                data: true,
                error: null
            });

            // Long enough for the in-process task to have run, had it been going to send.
            await new Promise(resolve => setTimeout(resolve, 1_000));
            expect(sent).toEqual([]);
        } finally {
            await server.close();
        }
    });
});
