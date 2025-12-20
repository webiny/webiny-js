import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import {
    SaveSettingsUseCase,
    SaveSettingsRepository,
    type SaveSettingsInput
} from "./abstractions.js";
import { MailerSettingsBeforeSaveEvent, MailerSettingsAfterSaveEvent } from "./events.js";
import { saveValidation } from "./validation.js";
import { SettingsValidationError, SettingsPersistenceError } from "~/domain/errors.js";

class SaveSettingsUseCaseImpl implements SaveSettingsUseCase.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private repository: SaveSettingsRepository.Interface
    ) {}

    async execute(input: SaveSettingsInput): SaveSettingsUseCase.Return {
        // Validate input
        const validationResult = saveValidation.safeParse(input);
        if (!validationResult.success) {
            return Result.fail(new SettingsValidationError(validationResult.error.errors));
        }

        // Publish before save event
        const beforeSaveEvent = new MailerSettingsBeforeSaveEvent({ input });
        await this.eventPublisher.publish(beforeSaveEvent);

        // Save settings
        const result = await this.repository.execute(input);

        if (result.isFail()) {
            return Result.fail(new SettingsPersistenceError(result.error));
        }

        // Publish after save event
        const afterSaveEvent = new MailerSettingsAfterSaveEvent({ settings: result.value });
        await this.eventPublisher.publish(afterSaveEvent);

        return result;
    }
}

export const SaveSettingsUseCaseImplementation = SaveSettingsUseCase.createImplementation({
    implementation: SaveSettingsUseCaseImpl,
    dependencies: [EventPublisher, SaveSettingsRepository]
});
