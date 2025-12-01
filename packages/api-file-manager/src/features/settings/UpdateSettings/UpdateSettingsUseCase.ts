import { Result } from "@webiny/feature/api";
import { UpdateSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateSettingsUseCase as CoreUpdateSettingsUseCase } from "@webiny/api-core/features/settings/UpdateSettings";
import { GetSettingsUseCase } from "../GetSettings/abstractions.js";
import type { FileManagerSettings } from "~/domain/settings/types.js";
import type { UpdateSettingsInput } from "~/domain/settings/types.js";
import { SettingsUpdateError } from "~/domain/settings/errors.js";
import { SettingsValidationError } from "~/domain/settings/errors.js";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { SettingsBeforeUpdateEvent, SettingsAfterUpdateEvent } from "./events.js";
import { updateSettingsValidation } from "~/domain/settings/validation.js";
import { createZodError } from "@webiny/utils";

class UpdateSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private updateSettings: CoreUpdateSettingsUseCase.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(
        input: UpdateSettingsInput
    ): Promise<Result<FileManagerSettings, UseCaseAbstraction.Error>> {
        // Validate input
        const validationResult = updateSettingsValidation.safeParse(input);
        if (!validationResult.success) {
            const zodError = createZodError(validationResult.error);
            return Result.fail(new SettingsValidationError(zodError.data!.invalidFields));
        }

        const validatedInput = validationResult.data;

        // Get existing settings to merge with new data
        const existingResult = await this.getSettings.execute();
        const existing = existingResult.value;

        // Prepare merged settings
        const mergedSettings: FileManagerSettings = {
            ...existing,
            ...validatedInput
        };

        // Publish BeforeUpdate event
        await this.eventPublisher.publish(
            new SettingsBeforeUpdateEvent({
                original: existing,
                settings: mergedSettings,
                input: validatedInput
            })
        );

        const result = await this.updateSettings.execute({
            name: FILE_MANAGER_GENERAL_SETTINGS,
            data: mergedSettings
        });

        if (result.isFail()) {
            return Result.fail(new SettingsUpdateError(result.error));
        }

        const updatedSettings = result.value.data as FileManagerSettings;

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
    dependencies: [CoreUpdateSettingsUseCase, GetSettingsUseCase, EventPublisher]
});
