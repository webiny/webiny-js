import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { KeyNotFoundError } from "@webiny/api-core/features/keyValueStore/index.js";
import { KeyValueStorageError } from "@webiny/api-core/features/keyValueStore/index.js";
import { SaveSettingsRepository } from "@webiny/api-mailer";
import { SaveSettingsRepositoryImplementation } from "@webiny/api-mailer/features/SaveSettings/SaveSettingsRepository.js";
import { SmtpSettingsDefinition } from "~/api/features/SmtpSettings/SmtpSettingsDefinition.js";

// SMTP settings without settings set in code.
const definition = new SmtpSettingsDefinition({ get: () => null } as any);

const INPUT = {
    host: "smtp.example.com",
    user: "user",
    from: "noreply@example.com"
};

const createRepository = (getResult: Result<unknown, Error>) => {
    const set = vi.fn(async () => Result.ok());

    const container = new Container();
    container.registerInstance(KeyValueStore, {
        get: async () => getResult,
        set
    } as unknown as KeyValueStore.Interface);
    container.registerInstance(Encryption, {
        encrypt: async (value: string) => `enc:${value}`,
        decrypt: async (value: string) => value.replace(/^enc:/, "")
    } as unknown as Encryption.Interface);
    container.register(SaveSettingsRepositoryImplementation);

    return { repository: container.resolve(SaveSettingsRepository), set };
};

describe("SaveSettingsRepository", () => {
    it("saves new settings when none are stored yet", async () => {
        const { repository, set } = createRepository(
            Result.fail(new KeyNotFoundError("mailer-transport-settings"))
        );

        const result = await repository.execute(definition, { ...INPUT, password: "secret" });

        expect(result.isOk()).toBe(true);
        expect(set).toHaveBeenCalledTimes(1);
    });

    it("does not overwrite the stored settings when reading them fails", async () => {
        const { repository, set } = createRepository(
            Result.fail(new KeyValueStorageError(new Error("storage unavailable")))
        );

        // No password: the user means "keep the stored one".
        const result = await repository.execute(definition, INPUT);

        expect(result.isFail()).toBe(true);
        expect(set).not.toHaveBeenCalled();
    });
});
