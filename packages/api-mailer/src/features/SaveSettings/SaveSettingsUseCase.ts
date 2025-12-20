import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/feature/api";
import WebinyError from "@webiny/error";
import {
    SaveSettings,
    SaveSettingsRepository,
    type SaveSettingsInput,
    MailerSettingsBeforeSaveEvent,
    MailerSettingsAfterSaveEvent
} from "./abstractions.js";
import { saveValidation } from "./validation.js";
import type { TransportSettings } from "~/types.js";

class SaveSettingsUseCaseImpl implements SaveSettings.Interface {
    constructor(
        private repository: SaveSettingsRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: SaveSettingsInput): Promise<Result<TransportSettings, never>> {
        // Validate input
        const validationResult = saveValidation.safeParse(input);
        if (!validationResult.success) {
            throw new WebinyError("Validation failed", "VALIDATION_ERROR", {
                errors: validationResult.error.errors
            });
        }

        // Publish before save event
        await this.eventPublisher.publish(
            new MailerSettingsBeforeSaveEvent({
                payload: { input }
            })
        );

        // Save settings
        const result = await this.repository.save(input);

        if (result.isError) {
            throw new WebinyError("Failed to save settings", "SAVE_SETTINGS_ERROR", result.error);
        }

        // Publish after save event
        await this.eventPublisher.publish(
            new MailerSettingsAfterSaveEvent({
                payload: { settings: result.value }
            })
        );

        return result;
    }
}

export const SaveSettingsUseCaseImplementation = SaveSettings.createImplementation({
    implementation: SaveSettingsUseCaseImpl,
    dependencies: [SaveSettingsRepository, EventPublisher]
});
