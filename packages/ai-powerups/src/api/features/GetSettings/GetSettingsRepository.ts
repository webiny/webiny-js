import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import { GetSettingsRepository } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";
import { AI_POWER_UPS_SETTINGS } from "~/api/constants.js";

class GetSettingsRepositoryImpl implements GetSettingsRepository.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private handlers: AiPowerUpsSettingsGroupHandler.Interface[]
    ) {}

    async get(): Promise<Result<IAiPowerUpsSettings>> {
        const storeResult =
            await this.keyValueStore.get<Record<string, unknown>>(AI_POWER_UPS_SETTINGS);

        const raw: Record<string, unknown> =
            storeResult.isOk() && storeResult.value ? storeResult.value : {};

        const result: Record<string, unknown> = {};

        // Run each handler's mapFromStorage for its section.
        for (const handler of this.handlers) {
            result[handler.name] = handler.mapFromStorage(raw[handler.name]);
        }

        // Preserve unknown sections (sections without a handler).
        for (const key of Object.keys(raw)) {
            if (!(key in result)) {
                result[key] = raw[key];
            }
        }

        return Result.ok(result as unknown as IAiPowerUpsSettings);
    }
}

export const GetSettingsRepositoryImplementation = GetSettingsRepository.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [KeyValueStore, [AiPowerUpsSettingsGroupHandler, { multiple: true }]]
});
