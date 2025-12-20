import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import WebinyError from "@webiny/error";
import { SaveSettings, SaveSettingsRepository, type SaveSettingsInput } from "./abstractions.js";
import { MailerSettingsBeforeSaveEvent, MailerSettingsAfterSaveEvent } from "./events.js";
import { saveValidation } from "./validation.js";
import type { TransportSettings } from "~/types.js";

class SaveSettingsUseCaseImpl implements SaveSettings.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private repository: SaveSettingsRepository.Interface
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
        const beforeSaveEvent = new MailerSettingsBeforeSaveEvent({ input });
        await this.eventPublisher.publish(beforeSaveEvent);

        // Save settings
        const result = await this.repository.save(input);

        if (result.isFail()) {
            throw new WebinyError("Failed to save settings", "SAVE_SETTINGS_ERROR", result.error);
        }

        // Publish after save event
        const afterSaveEvent = new MailerSettingsAfterSaveEvent({ settings: result.value });
        await this.eventPublisher.publish(afterSaveEvent);

        return result;
    }
}

export const SaveSettingsUseCaseImplementation = SaveSettings.createImplementation({
    implementation: SaveSettingsUseCaseImpl,
    dependencies: [EventPublisher, SaveSettingsRepository]
});
