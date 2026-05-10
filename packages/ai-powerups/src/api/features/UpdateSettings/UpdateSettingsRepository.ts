import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import type { OutputErrors } from "@webiny/utils/createZodError.js";
import {
    AiPowerUpsSettingsGroupHandler,
    AiPowerUpsSettingsCache
} from "~/api/features/shared/index.js";
import { UpdateSettingsRepository } from "./abstractions.js";
import { SettingsValidationError } from "./errors.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";
import { AI_POWER_UPS_SETTINGS } from "~/api/constants.js";

class UpdateSettingsRepositoryImpl implements UpdateSettingsRepository.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private handlers: AiPowerUpsSettingsGroupHandler.Interface[],
        private cache: AiPowerUpsSettingsCache.Interface
    ) {}

    async execute(input: IAiPowerUpsSettings): Promise<Result<IAiPowerUpsSettings, Error>> {
        const cached = this.cache.get();
        let raw: Record<string, unknown>;

        if (cached) {
            raw = cached.raw;
        } else {
            const storeResult =
                await this.keyValueStore.get<Record<string, unknown>>(AI_POWER_UPS_SETTINGS);
            raw = storeResult.isOk() && storeResult.value ? storeResult.value : {};
        }

        const existingInternal: Record<string, unknown> = {};
        for (const handler of this.handlers) {
            existingInternal[handler.name] = handler.mapFromStorage(raw[handler.name]);
        }

        const newSettings = input as unknown as Record<string, unknown>;
        const invalidFields: OutputErrors = {};

        for (const handler of this.handlers) {
            const parseResult = await handler.inputSchema.safeParseAsync(newSettings[handler.name]);
            if (!parseResult.success) {
                for (const issue of parseResult.error.issues) {
                    const fieldPath = [handler.name, ...issue.path.map(String)].join(".");
                    invalidFields[fieldPath] = {
                        code: issue.code,
                        message: issue.message,
                        data: { path: issue.path }
                    };
                }
            }
        }

        if (Object.keys(invalidFields).length > 0) {
            return Result.fail(new SettingsValidationError(invalidFields));
        }

        const persisted: Record<string, unknown> = { ...raw };
        for (const handler of this.handlers) {
            persisted[handler.name] = await handler.mapToStorage(
                newSettings[handler.name],
                existingInternal[handler.name]
            );
        }

        const writeResult = await this.keyValueStore.set(AI_POWER_UPS_SETTINGS, persisted);
        if (writeResult.isFail()) {
            return Result.fail(new Error(String(writeResult.error)));
        }

        const result: Record<string, unknown> = {};
        for (const handler of this.handlers) {
            result[handler.name] = handler.mapFromStorage(persisted[handler.name]);
        }

        for (const key of Object.keys(persisted)) {
            if (!(key in result)) {
                result[key] = persisted[key];
            }
        }

        const mapped = result as unknown as IAiPowerUpsSettings;
        this.cache.set(persisted, mapped);

        return Result.ok(mapped);
    }
}

export const UpdateSettingsRepositoryImplementation = UpdateSettingsRepository.createImplementation(
    {
        implementation: UpdateSettingsRepositoryImpl,
        dependencies: [
            KeyValueStore,
            [AiPowerUpsSettingsGroupHandler, { multiple: true }],
            AiPowerUpsSettingsCache
        ]
    }
);
