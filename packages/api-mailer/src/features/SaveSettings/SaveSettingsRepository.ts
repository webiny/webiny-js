import { Result } from "@webiny/feature/api";
import { Encryption } from "~/domain/Encryption/abstractions.js";
import { SaveSettingsRepository, type SaveSettingsInput } from "./abstractions.js";
import type { TransportSettings } from "~/types.js";
import { SettingsPersistenceError } from "~/domain/errors.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { MAILER_TRANSPORT_SETTINGS } from "~/constants.js";

const DEFAULT_PORT = 25;

class SaveSettingsRepositoryImpl implements SaveSettingsRepository.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private encryption: Encryption.Interface
    ) {}

    async execute(input: SaveSettingsInput): SaveSettingsRepository.Return {
        // Check if settings exist
        const existingResult =
            await this.keyValueStore.get<TransportSettings>(MAILER_TRANSPORT_SETTINGS);
        const existingSettings = existingResult.isOk() ? existingResult.value : null;
        const transportSettings: Partial<TransportSettings> = existingSettings ?? {};

        // If updating and no password provided, keep the existing password
        let passwordToStore = input.password || "";
        if (!input.password && existingSettings) {
            passwordToStore = await this.encryption.decrypt(transportSettings.password || "");
        }

        // Encrypt password
        const encryptedPassword = await this.encryption.encrypt(passwordToStore);

        // Prepare data
        const data = {
            host: input.host ?? transportSettings.host,
            port: input.port ?? transportSettings.port ?? DEFAULT_PORT,
            user: input.user ?? transportSettings.user,
            password: encryptedPassword,
            from: input.from ?? transportSettings.from,
            replyTo: input.replyTo ?? transportSettings.replyTo
        };

        // Save settings
        const result = await this.keyValueStore.set(MAILER_TRANSPORT_SETTINGS, data);

        if (result.isFail()) {
            return Result.fail(new SettingsPersistenceError(result.error));
        }

        // Return without encrypted password
        const returnSettings: TransportSettings = {
            ...data,
            password: "" // Don't return password
        };

        return Result.ok(returnSettings);
    }
}

export const SaveSettingsRepositoryImplementation = SaveSettingsRepository.createImplementation({
    implementation: SaveSettingsRepositoryImpl,
    dependencies: [KeyValueStore, Encryption]
});
