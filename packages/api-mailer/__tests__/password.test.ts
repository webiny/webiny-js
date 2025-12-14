import { describe, it, expect } from "vitest";
import { decrypt, encrypt } from "~/crud/settings/password";
import { DecryptionError } from "~/errors";
import WebinyError from "@webiny/error";

const secret = "someReallySecretSecretWithRandomNumbersOrLettersOrSomethingElse";
const password = "GZPJWYVIYnUX99dGnk1N";

describe("password decrypt and encrypt", () => {
    it("should encrypt and decrypt password", async () => {
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

    /**
     * All these values are encrypted "password" word.
     * We must make sure that after each encryption, it is decryptable.
     */
    const encryptedValues: [number, string][] = [
        [1, "U2FsdGVkX19N+tZuIEBCAIiUTbEAVztC1C9YkOC+b+k="],
        [2, "U2FsdGVkX196nYqxam8yKqTaVtsweCLM7+HbOXgKb4k="],
        [3, "U2FsdGVkX18Gh1O4v6A7O1I8KMbqu5FkkFc/86YuHfA="],
        [4, "U2FsdGVkX19IDvjoAPnMZwFrTPPAUh8ApkMYM9VhRoc="]
    ];

    it.each(encryptedValues)(`should decrypt "password" - %s`, async (_, value) => {
        const result = decrypt({
            secret: "someReallySecretSecret",
            value
        });
        expect(result).toEqual("password");
    });

    describe("error handling", () => {
        it("should throw error when encrypting without secret", () => {
            expect(() =>
                encrypt({
                    secret: null,
                    value: password
                })
            ).toThrow(WebinyError);

            expect(() =>
                encrypt({
                    secret: null,
                    value: password
                })
            ).toThrow("Cannot call encrypt without passing the secret");
        });

        it("should throw error when decrypting without secret", () => {
            expect(() =>
                decrypt({
                    secret: null,
                    value: "someEncryptedValue"
                })
            ).toThrow(WebinyError);

            expect(() =>
                decrypt({
                    secret: null,
                    value: "someEncryptedValue"
                })
            ).toThrow("Cannot call decrypt without passing the secret");
        });

        it("should throw error when secret is too short", () => {
            expect(() =>
                encrypt({
                    secret: "short",
                    value: password
                })
            ).toThrow(WebinyError);

            expect(() =>
                encrypt({
                    secret: "short",
                    value: password
                })
            ).toThrow("Secret must be at least 16 characters long");
        });

        it("should throw DecryptionError for invalid encrypted value", () => {
            expect(() =>
                decrypt({
                    secret,
                    value: "invalidEncryptedValue"
                })
            ).toThrow(DecryptionError);
        });

        it("should throw DecryptionError for corrupted data", () => {
            expect(() =>
                decrypt({
                    secret,
                    value: "U2FsdGVkX1_CORRUPTED_DATA"
                })
            ).toThrow(DecryptionError);
        });

        it("should throw DecryptionError when decrypting with wrong secret", () => {
            const encrypted = encrypt({
                secret,
                value: password
            });

            expect(() =>
                decrypt({
                    secret: "differentSecretThatIsLongEnough123",
                    value: encrypted
                })
            ).toThrow(DecryptionError);
        });
    });

    describe("edge cases", () => {
        it("should return empty string for null value on encrypt", () => {
            const result = encrypt({
                secret,
                value: null
            });
            expect(result).toBe("");
        });

        it("should return empty string for undefined value on encrypt", () => {
            const result = encrypt({
                secret,
                value: undefined
            });
            expect(result).toBe("");
        });

        it("should return empty string for null value on decrypt", () => {
            const result = decrypt({
                secret,
                value: null
            });
            expect(result).toBe("");
        });

        it("should return empty string for undefined value on decrypt", () => {
            const result = decrypt({
                secret,
                value: undefined
            });
            expect(result).toBe("");
        });

        it("should handle empty string as password", () => {
            const encrypted = encrypt({
                secret,
                value: ""
            });
            expect(encrypted).toBe("");

            const decrypted = decrypt({
                secret,
                value: ""
            });
            expect(decrypted).toBe("");
        });

        it("should handle passwords with special characters", () => {
            const specialPassword = "P@ssw0rd!#$%^&*()[]{}|;:,.<>?/~`";
            const encrypted = encrypt({
                secret,
                value: specialPassword
            });
            const decrypted = decrypt({
                secret,
                value: encrypted
            });
            expect(decrypted).toBe(specialPassword);
        });

        it("should handle unicode passwords", () => {
            const unicodePassword = "パスワード密码🔒";
            const encrypted = encrypt({
                secret,
                value: unicodePassword
            });
            const decrypted = decrypt({
                secret,
                value: encrypted
            });
            expect(decrypted).toBe(unicodePassword);
        });
    });
});
