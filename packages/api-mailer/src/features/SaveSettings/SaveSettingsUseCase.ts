import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    SaveSettingsUseCase,
    SaveSettingsRepository,
    type SaveSettingsInput
} from "./abstractions.js";
import { MailerSettingsBeforeSaveEvent, MailerSettingsAfterSaveEvent } from "./events.js";
import { saveValidation } from "./validation.js";
import {
    SettingsValidationError,
    SettingsPersistenceError,
    SettingsNotAuthorized,
    SettingsLockedByCode
} from "~/domain/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CodeMailerSettings } from "~/domain/CodeMailerSettings/abstractions.js";
import { ActiveTransport } from "~/domain/MailTransport/abstractions.js";

class SaveSettingsUseCaseImpl implements SaveSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private repository: SaveSettingsRepository.Interface,
        private codeSettings: CodeMailerSettings.Interface,
        private activeTransport: ActiveTransport.Interface
    ) {}

    async execute(input: SaveSettingsInput): SaveSettingsUseCase.Return {
        const permission = await this.identityContext.getPermission("mailer.settings");

        if (!permission) {
            return Result.fail(new SettingsNotAuthorized());
        }

        // Validate input.
        const validationResult = saveValidation.safeParse(input);
        if (!validationResult.success) {
            return Result.fail(new SettingsValidationError(validationResult.error.issues));
        }

        // Refuse when settings are defined via code.
        const transportName = this.activeTransport.name();
        if (transportName && this.codeSettings.get(transportName) !== null) {
            return Result.fail(new SettingsLockedByCode());
        }

        // Publish before save event. The event constructor strips the password
        // internally — subscribers never see it, regardless of what we pass here.
        const beforeSaveEvent = new MailerSettingsBeforeSaveEvent({ input });
        await this.eventPublisher.publish(beforeSaveEvent);

        // Save settings.
        const result = await this.repository.execute(input);

        if (result.isFail()) {
            return Result.fail(new SettingsPersistenceError(result.error));
        }

        // Publish after save event. Same class-level password strip as above.
        const afterSaveEvent = new MailerSettingsAfterSaveEvent({ settings: result.value });
        await this.eventPublisher.publish(afterSaveEvent);

        return result;
    }
}

export const SaveSettingsUseCaseImplementation = SaveSettingsUseCase.createImplementation({
    implementation: SaveSettingsUseCaseImpl,
    dependencies: [
        IdentityContext,
        EventPublisher,
        SaveSettingsRepository,
        CodeMailerSettings,
        ActiveTransport
    ]
});
