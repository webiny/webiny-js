import { Result } from "@webiny/feature/api";
import { UpdateSettingsUseCase } from "@webiny/api-core/features/settings/UpdateSettings/index.js";
import { GetSettingsUseCase } from "@webiny/api-core/features/settings/GetSettings/index.js";
import { Encryption } from "~/domain/Encryption/abstractions.js";
import { SaveSettingsRepository, type SaveSettingsInput } from "./abstractions.js";
import type { TransportSettings } from "~/types.js";
import { SettingsPersistenceError } from "~/domain/errors.js";

const SETTINGS_NAME = "mailerTransportSettings";
const DEFAULT_PORT = 25;

class SaveSettingsRepositoryImpl implements SaveSettingsRepository.Interface {
    constructor(
        private getSettings: GetSettingsUseCase.Interface,
        private updateSettings: UpdateSettingsUseCase.Interface,
        private encryption: Encryption.Interface
    ) {}

    async execute(input: SaveSettingsInput): SaveSettingsRepository.Return {
        // Check if settings exist
        const existingResult = await this.getSettings.execute(SETTINGS_NAME);
        const existingSettings = existingResult.isOk() ? existingResult.value : null;

        // If updating and no password provided, keep the existing password
        let passwordToStore = input.password || "";
        if (!input.password && existingSettings) {
            const existingData = existingSettings.data as TransportSettings;
            passwordToStore = existingData.password || "";
        }

        // Encrypt password
        const encryptedPassword = await this.encryption.encrypt(passwordToStore);

        // Prepare data
        const data = {
            host: input.host,
            port: input.port || DEFAULT_PORT,
            user: input.user,
            password: encryptedPassword,
            from: input.from,
            replyTo: input.replyTo || ""
        };

        // Save settings
        const result = await this.updateSettings.execute({
            name: SETTINGS_NAME,
            data
        });

        if (result.isFail()) {
            return Result.fail(new SettingsPersistenceError(result.error));
        }

        // Return without encrypted password
        const transportSettings: TransportSettings = {
            host: input.host,
            port: input.port || DEFAULT_PORT,
            user: input.user,
            password: "", // Don't return password
            from: input.from,
            replyTo: input.replyTo
        };

        return Result.ok(transportSettings);
    }
}

export const SaveSettingsRepositoryImplementation = SaveSettingsRepository.createImplementation({
    implementation: SaveSettingsRepositoryImpl,
    dependencies: [GetSettingsUseCase, UpdateSettingsUseCase, Encryption]
});
