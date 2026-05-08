import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import type { OutputErrors } from "@webiny/utils/createZodError.js";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import { UpdateSettingsRepository } from "./abstractions.js";
import { SettingsValidationError } from "./errors.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";
import { AI_POWER_UPS_SETTINGS } from "~/api/constants.js";

class UpdateSettingsRepositoryImpl implements UpdateSettingsRepository.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private handlers: AiPowerUpsSettingsGroupHandler.Interface[]
    ) {}

    async execute(input: IAiPowerUpsSettings): Promise<Result<IAiPowerUpsSettings, Error>> {
        // Load current raw record.
        const storeResult =
            await this.keyValueStore.get<Record<string, unknown>>(AI_POWER_UPS_SETTINGS);
        const raw: Record<string, unknown> =
            storeResult.isOk() && storeResult.value ? storeResult.value : {};

        // Build current internal shape for the `existing` parameter.
        const existingInternal: Record<string, unknown> = {};
        for (const handler of this.handlers) {
            existingInternal[handler.name] = handler.mapFromStorage(raw[handler.name]);
        }

        const newSettings = input as unknown as Record<string, unknown>;
        const invalidFields: OutputErrors = {};

        // Validate all sections first.
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

        // Transform all sections to storage shape.
        const persisted: Record<string, unknown> = { ...raw };
        for (const handler of this.handlers) {
            persisted[handler.name] = await handler.mapToStorage(
                newSettings[handler.name],
                existingInternal[handler.name]
            );
        }

        // Write merged record.
        const writeResult = await this.keyValueStore.set(AI_POWER_UPS_SETTINGS, persisted);
        if (writeResult.isFail()) {
            return Result.fail(new Error(String(writeResult.error)));
        }

        // Build and return the new internal shape.
        const result: Record<string, unknown> = {};
        for (const handler of this.handlers) {
            result[handler.name] = handler.mapFromStorage(persisted[handler.name]);
        }

        // Preserve unknown sections.
        for (const key of Object.keys(persisted)) {
            if (!(key in result)) {
                result[key] = persisted[key];
            }
        }

        return Result.ok(result as unknown as IAiPowerUpsSettings);
    }
}

export const UpdateSettingsRepositoryImplementation = UpdateSettingsRepository.createImplementation(
    {
        implementation: UpdateSettingsRepositoryImpl,
        dependencies: [KeyValueStore, [AiPowerUpsSettingsGroupHandler, { multiple: true }]]
    }
);
