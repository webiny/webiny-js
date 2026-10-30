import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { readResetPasswordTarget } from "~/cli/readResetPasswordTarget.js";

/**
 * What `webiny reset-password` resolves before it prompts. The env is passed in, so these cases
 * don't depend on what the machine running the suite has set.
 */
describe("readResetPasswordTarget", () => {
    const env = {
        WEBINY_SELF_HOSTED_AUTH_SECRET: "s3cret",
        WEBINY_API_URL: "http://localhost:3002/"
    };

    it("reads both halves from env, without the API URL's trailing slash", () => {
        expect(readResetPasswordTarget({}, env)).toEqual({
            apiUrl: "http://localhost:3002",
            signingSecret: "s3cret"
        });
    });

    it("lets flags override both halves", () => {
        const target = readResetPasswordTarget(
            { apiUrl: "https://api.example.com/", signingSecret: "from-flag" },
            env
        );

        expect(target).toEqual({ apiUrl: "https://api.example.com", signingSecret: "from-flag" });
    });

    it("reports a missing secret before a missing API URL, since the prompt costs more", () => {
        expect(() => readResetPasswordTarget({}, {})).toThrow(
            /No JWT signing secret available\. Set \$WEBINY_SELF_HOSTED_AUTH_SECRET/
        );
    });

    it("names every route to an API URL when there is none", () => {
        expect(() =>
            readResetPasswordTarget({}, { WEBINY_SELF_HOSTED_AUTH_SECRET: "s3cret" })
        ).toThrow(/No API URL configured\. Set \$WEBINY_API_URL.*<Infra\.ApiUrl.*--api-url/);
    });
});
