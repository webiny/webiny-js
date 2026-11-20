import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { readSigningSecret } from "~/readSigningSecret.js";

describe("readSigningSecret", () => {
    it("returns the secret exactly as given, because the CLI signs with the untrimmed value", () => {
        expect(readSigningSecret({ WEBINY_SELF_HOSTED_AUTH_SECRET: " secret " })).toBe(" secret ");
    });

    it("refuses a missing or blank secret", () => {
        const message =
            "The standalone API is missing required configuration: WEBINY_SELF_HOSTED_AUTH_SECRET is not set.";

        expect(() => readSigningSecret({})).toThrowError(message);
        expect(() => readSigningSecret({ WEBINY_SELF_HOSTED_AUTH_SECRET: "  " })).toThrowError(
            message
        );
    });
});
