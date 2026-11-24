import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { MailTransportFactory } from "@webiny/api-mailer/domain/MailTransport/abstractions.js";
import type { MailTransport } from "@webiny/api-mailer/domain/MailTransport/abstractions.js";
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

/*
 * A mail transport that records each mail as the address and the code read back out of its text,
 * so the real mailer runs and no SMTP server is needed.
 */
const createRecordingTransport = (sent: { email: string; code: string }[]) => {
    class RecordingTransportFactory implements MailTransportFactory.Interface {
        public readonly name = "Test/RecordingTransport";

        async createTransport() {
            return {
                name: this.name,
                send: async (params: MailTransport.SendParams) => {
                    const code = params.text?.match(/code is (\d+)\./)?.[1] ?? "";
                    sent.push({ email: params.to?.[0] ?? "", code });
                    return { result: true, error: null };
                }
            };
        }
    }

    return createRegisterExtensionPlugin(({ container }) => {
        container.register(
            MailTransportFactory.createImplementation({
                implementation: RecordingTransportFactory,
                dependencies: []
            })
        );
    });
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
 * a background task, and the task mails the code. Mail goes through the real mailer to a transport that
 * records it, so no SMTP server is needed.
 */
describe("api-runtime-standalone-sql — password reset by email", () => {
    it("mails a code from a background task, and the code resets the password", async () => {
        const sent: { email: string; code: string }[] = [];
        const mailer = createRecordingTransport(sent);

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
        const sent: { email: string; code: string }[] = [];
        const mailer = createRecordingTransport(sent);

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
