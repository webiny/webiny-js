import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
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
import { MailTransportFactory } from "~/domain/MailTransport/abstractions.js";

class SaveSettingsUseCaseImpl implements SaveSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: SaveSettingsRepository.Interface,
        private codeSettings: CodeMailerSettings.Interface,
        private transportFactories: MailTransportFactory.Interface[]
    ) {}

    async execute(input: SaveSettingsInput): SaveSettingsUseCase.Return {
        const permission = await this.identityContext.getPermission("mailer.settings");

        if (!permission) {
            return Result.fail(new SettingsNotAuthorized());
        }

        const validationResult = saveValidation.safeParse(input);
        if (!validationResult.success) {
            return Result.fail(new SettingsValidationError(validationResult.error.issues));
        }

        /* Refuse when any registered transport has code-defined settings. */
        const isLockedByCode = this.transportFactories.some(
            f => this.codeSettings.get(f.name) !== null
        );

        if (isLockedByCode) {
            return Result.fail(new SettingsLockedByCode());
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _beforePassword, ...inputForEvent } = input;
        const beforeSaveEvent = new MailerSettingsBeforeSaveEvent({ input: inputForEvent });
        await this.eventPublisher.publish(beforeSaveEvent);

        const result = await this.repository.execute(input);

        if (result.isFail()) {
            return Result.fail(new SettingsPersistenceError(result.error));
        }

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
        [MailTransportFactory, { multiple: true }]
    ]
});
