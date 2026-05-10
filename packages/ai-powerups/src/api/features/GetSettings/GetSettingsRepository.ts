import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import {
    AiPowerUpsSettingsGroupHandler,
    AiPowerUpsSettingsCache
} from "~/api/features/shared/index.js";
import { GetSettingsRepository } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";
import { AI_POWER_UPS_SETTINGS } from "~/api/constants.js";

class GetSettingsRepositoryImpl implements GetSettingsRepository.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private handlers: AiPowerUpsSettingsGroupHandler.Interface[],
        private cache: AiPowerUpsSettingsCache.Interface
    ) {}

    async get(): Promise<Result<IAiPowerUpsSettings>> {
        const cached = this.cache.get();
        if (cached) {
            return Result.ok(cached.mapped);
        }

        const storeResult =
            await this.keyValueStore.get<Record<string, unknown>>(AI_POWER_UPS_SETTINGS);

        const raw: Record<string, unknown> =
            storeResult.isOk() && storeResult.value ? storeResult.value : {};

        const result: Record<string, unknown> = {};

        for (const handler of this.handlers) {
            result[handler.name] = handler.mapFromStorage(raw[handler.name]);
        }

        for (const key of Object.keys(raw)) {
            if (!(key in result)) {
                result[key] = raw[key];
            }
        }

        const mapped = result as unknown as IAiPowerUpsSettings;
        this.cache.set(raw, mapped);

        return Result.ok(mapped);
    }
}

export const GetSettingsRepositoryImplementation = GetSettingsRepository.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [
        KeyValueStore,
        [AiPowerUpsSettingsGroupHandler, { multiple: true }],
        AiPowerUpsSettingsCache
    ]
});
