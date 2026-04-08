import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { UpdateSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetSettingsUseCase } from "../GetSettings/abstractions.js";
import type { FileManagerSettings } from "~/domain/settings/types.js";
import type { UpdateSettingsInput } from "~/domain/settings/types.js";
import { SettingsUpdateError } from "~/domain/settings/errors.js";
import { SettingsValidationError } from "~/domain/settings/errors.js";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { SettingsBeforeUpdateEvent, SettingsAfterUpdateEvent } from "./events.js";
import { updateSettingsValidation } from "~/domain/settings/validation.js";
import { createZodError } from "@webiny/utils";

class UpdateSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(
        input: UpdateSettingsInput
    ): Promise<Result<FileManagerSettings, UseCaseAbstraction.Error>> {
        // Validate input
        const validationResult = await updateSettingsValidation.safeParseAsync(input);
        if (!validationResult.success) {
            const zodError = createZodError(validationResult.error);
            return Result.fail(new SettingsValidationError(zodError.data!.invalidFields));
        }

        const validatedInput = validationResult.data;

        // Get existing settings to merge with new data
        const existingResult = await this.getSettings.execute();
        const existing = existingResult.value;

        // Prepare merged settings
        const updatedSettings: FileManagerSettings = {
            ...existing,
            ...validatedInput
        };

        // Publish BeforeUpdate event
        await this.eventPublisher.publish(
            new SettingsBeforeUpdateEvent({
                original: existing,
                settings: updatedSettings,
                input: validatedInput
            })
        );

        const result = await this.keyValueStore.set(FILE_MANAGER_GENERAL_SETTINGS, updatedSettings);

        if (result.isFail()) {
            return Result.fail(new SettingsUpdateError(result.error));
        }

        // Publish AfterUpdate event
        await this.eventPublisher.publish(
            new SettingsAfterUpdateEvent({
                original: existing,
                settings: updatedSettings,
                input: validatedInput
            })
        );

        return Result.ok(updatedSettings);
    }
}

export const UpdateSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateSettingsUseCaseImpl,
    dependencies: [KeyValueStore, GetSettingsUseCase, EventPublisher]
});
