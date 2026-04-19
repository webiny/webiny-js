import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { SaveSettingsRepository, type SaveSettingsInput } from "./abstractions.js";
import type { AiPowerupsSettings } from "~/api/types.js";
import { AI_POWERUPS_SETTINGS } from "~/api/constants.js";

class SaveSettingsRepositoryImpl implements SaveSettingsRepository.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private encryption: Encryption.Interface
    ) {}

    async execute(input: SaveSettingsInput): Promise<Result<AiPowerupsSettings, Error>> {
        const providers = await Promise.all(
            input.providers.map(async provider => ({
                ...provider,
                apiKey: await this.encryption.encrypt(provider.apiKey)
            }))
        );

        const result = await this.keyValueStore.set(AI_POWERUPS_SETTINGS, { providers });

        if (result.isFail()) {
            return Result.fail(new Error(String(result.error)));
        }

        return Result.ok({ providers: input.providers });
    }
}

export const SaveSettingsRepositoryImplementation = SaveSettingsRepository.createImplementation({
    implementation: SaveSettingsRepositoryImpl,
    dependencies: [KeyValueStore, Encryption]
});
