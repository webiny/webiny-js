import { describe, it, expect } from "vitest";
import { Result } from "@webiny/feature/api";
import { SaveSettingsRepositoryImplementation } from "~/features/SaveSettings/SaveSettingsRepository.js";
import { MAILER_TRANSPORT_SETTINGS } from "~/constants.js";

/**
 * Pure unit test (no DynamoDB): an omitted password may only re-use the stored one while the
 * connection target (host, port, secure, user) stays the same.
 */
const stored = {
    host: "smtp.webiny",
    port: 587,
    secure: false,
    user: "user",
    password: "enc:stored-password",
    from: "from@webiny.com",
    replyTo: undefined
};

const setup = () => {
    const values = new Map<string, any>([[MAILER_TRANSPORT_SETTINGS, { ...stored }]]);
    const keyValueStore = {
        get: async (key: string) => Result.ok(values.get(key)),
        set: async (key: string, value: any) => {
            values.set(key, value);
            return Result.ok(value);
        }
    };
    const encryption = {
        encrypt: async (value: string) => `enc:${value}`,
        decrypt: async (value: string) => value.replace(/^enc:/, "")
    };
    return {
        repository: new SaveSettingsRepositoryImplementation(
            keyValueStore as any,
            encryption as any
        ),
        getStored: () => values.get(MAILER_TRANSPORT_SETTINGS)
    };
};

const base = { host: stored.host, user: stored.user, from: stored.from };

describe("save mailer settings without password", () => {
    it("should keep the stored password when the connection settings are unchanged", async () => {
        const { repository, getStored } = setup();

        const result = await repository.execute({ ...base, from: "new-from@webiny.com" });

        expect(result.isOk()).toBe(true);
        expect(getStored().password).toBe("enc:stored-password");
        expect(getStored().from).toBe("new-from@webiny.com");
    });

    it.each([
        ["host", { host: "attacker.example" }],
        ["port", { port: 2525 }],
        ["secure", { secure: true }],
        ["user", { user: "other-user" }]
    ])("should require the password when %s changes", async (_, change) => {
        const { repository, getStored } = setup();

        const result = await repository.execute({ ...base, ...change });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Mailer/Settings/Validation");
        expect(getStored()).toEqual(stored);
    });

    it("should save changed connection settings when the password is provided", async () => {
        const { repository, getStored } = setup();

        const result = await repository.execute({
            ...base,
            host: "smtp2.webiny",
            password: "new-password"
        });

        expect(result.isOk()).toBe(true);
        expect(getStored().host).toBe("smtp2.webiny");
        expect(getStored().password).toBe("enc:new-password");
    });
});
