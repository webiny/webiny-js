import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetSettingsRepository } from "./abstractions.js";
import type { AiProvider, AiPowerupsSettings } from "~/api/types.js";
import { AI_POWERUPS_SETTINGS } from "~/api/constants.js";

class GetSettingsRepositoryImpl implements GetSettingsRepository.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private encryption: Encryption.Interface
    ) {}

    async get(): Promise<Result<AiPowerupsSettings | null>> {
        const result = await this.keyValueStore.get<AiPowerupsSettings>(AI_POWERUPS_SETTINGS);

        if (result.isFail() || !result.value) {
            return Result.ok(null);
        }

        const settings = result.value;

        const providers = await Promise.all(
            (settings.providers ?? []).map(async (provider: AiProvider) => ({
                ...provider,
                apiKey: await this.encryption.decrypt(provider.apiKey)
            }))
        );

        return Result.ok({ providers });
    }
}

export const GetSettingsRepositoryImplementation = GetSettingsRepository.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [KeyValueStore, Encryption]
});
