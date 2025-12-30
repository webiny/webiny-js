import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "~/features/Encryption/utils/password.js";

const secret = "someReallySecretSecretWithRandomNumbersOrLettersOrSomethingElse";
const passwords = ["GZPJWYVIYnUX99dGnk1N", "t302uhgdjsbgfjkdsbjk", "webiny", "aPasswordWhichIsEasilyRemembered"];

describe("password decrypt and encrypt", () => {
    it.each(passwords)("should encrypt and decrypt password", async password => {
        const encryptResult = encrypt({
            secret,
            value: password
        });

        expect(encryptResult).toEqual(expect.any(String));

        const decryptResult = decrypt({
            secret,
            value: encryptResult
        });

        expect(decryptResult).toEqual(password);
    });
});
