import { describe, it, expect } from "vitest";
import { isValidSigningSecret } from "~/api/utils/isValidSigningSecret.js";

describe("isValidSigningSecret", () => {
    it.each([
        ["", true],
        [undefined, true],
        ["plain text secret", true],
        ["whsec_dGVzdHNlY3JldA==", true],
        ["whsec_", false],
        ["whsec_not base64!", false],
        ["whsec_abc", false]
    ])("%s => %s", (secret, expected) => {
        expect(isValidSigningSecret(secret)).toBe(expected);
    });
});
