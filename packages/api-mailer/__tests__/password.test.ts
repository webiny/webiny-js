import { decrypt, encrypt } from "~/crud/settings/password";

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
        console.info();
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
});
