import { afterEach, describe, expect, it, vi } from "vitest";
import { ResetPassword } from "~/cli/ResetPassword.js";
import { verifyCliResetToken } from "~/shared/cliResetToken.js";

/**
 * The reset with no terminal attached. `ResetPasswordCommand` is one caller; these cases exist to
 * keep it possible to be another (a seeding script, an installer) without going through yargs or a
 * password prompt.
 */

const SECRET = "s3cret";

// What `<SelfHostedAuth signingSecret>` and `<Infra.ApiUrl>` render.
const extensions: Record<string, Array<{ params: unknown }>> = {
    "Project/EnvVar": [
        { params: { varName: "WEBINY_SELF_HOSTED_AUTH_SECRET", value: SECRET } },
        { params: { varName: "WEBINY_API_URL", value: "http://localhost:3002/" } }
    ]
};

const configured = {
    extensionsByType: (type: string) => extensions[type] ?? []
};

describe("ResetPassword", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it("resolves the target from the project config", () => {
        const target = new ResetPassword(configured).resolveTarget({});

        // Trailing slash stripped, so callers can append a path without doubling it.
        expect(target).toEqual({ apiUrl: "http://localhost:3002", signingSecret: SECRET });
    });

    it("lets the caller override both halves of the target", () => {
        const target = new ResetPassword(configured).resolveTarget({
            apiUrl: "https://api.example.com",
            signingSecret: "from-caller"
        });

        expect(target).toEqual({
            apiUrl: "https://api.example.com",
            signingSecret: "from-caller"
        });
    });

    it("reports a missing secret before a missing API URL, since the prompt costs more", () => {
        // Emptied rather than assumed absent: an operator running the suite may well have it set.
        vi.stubEnv("WEBINY_SELF_HOSTED_SIGNING_SECRET", "");

        const resetPassword = new ResetPassword({ extensionsByType: () => [] });

        expect(() => resetPassword.resolveTarget({})).toThrow(/No JWT signing secret available/);
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

        const resetPassword = new ResetPassword(configured);

        await resetPassword.execute({
            email: "admin@example.com",
            password: "long-enough-password",
            target: resetPassword.resolveTarget({})
        });

        expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3002/graphql");

        const sent = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);

        expect(sent.variables.password).toBe("long-enough-password");
        expect(verifyCliResetToken({ secret: SECRET, token: sent.variables.token })).toEqual({
            email: "admin@example.com"
        });
    });
});
