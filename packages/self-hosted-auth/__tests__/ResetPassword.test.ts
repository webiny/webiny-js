import { afterEach, describe, expect, it, vi } from "vitest";
import { ResetPassword } from "~/cli/ResetPassword.js";
import { verifyCliResetToken } from "~/shared/cliResetToken.js";

/**
 * The reset with no terminal attached. `ResetPasswordCommand` is one caller; these cases exist to
 * keep it possible to be another (a seeding script, an installer) without going through yargs or a
 * password prompt.
 */

const SECRET = "s3cret";

const target = { apiUrl: "http://localhost:3002", signingSecret: SECRET };

describe("ResetPassword", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("posts a token the API side can verify", async () => {
        const fetchMock = vi.fn(async () => ({
            ok: true,
            status: 200,
            json: async () => ({
                data: { selfHostedAuthCliResetPassword: { data: true, error: null } }
            })
        }));

        vi.stubGlobal("fetch", fetchMock);

        const resetPassword = new ResetPassword();

        await resetPassword.execute({
            email: "admin@example.com",
            password: "long-enough-password",
            target
        });

        expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3002/graphql");

        const sent = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);

        expect(sent.variables.password).toBe("long-enough-password");
        expect(verifyCliResetToken({ secret: SECRET, token: sent.variables.token })).toEqual({
            email: "admin@example.com"
        });
    });
});
