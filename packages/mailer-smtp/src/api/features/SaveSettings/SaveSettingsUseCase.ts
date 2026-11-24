import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { SaveSettingsUseCase } from "./abstractions.js";
import { SaveSettingsRepository } from "./abstractions.js";
import type { SaveSettingsInput } from "./abstractions.js";
import { MailerSettingsBeforeSaveEvent, MailerSettingsAfterSaveEvent } from "./events.js";
import { saveValidation } from "./validation.js";
import { SettingsValidationError } from "~/api/domain/errors.js";
import { SettingsPersistenceError } from "~/api/domain/errors.js";
import { SettingsNotAuthorized } from "~/api/domain/errors.js";
import { SettingsLockedByCode } from "~/api/domain/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CodeMailerSettings } from "~/api/domain/CodeMailerSettings/abstractions.js";
import { MAILER_SETTINGS_PERMISSION } from "@webiny/api-mailer";
import { SMTP_TRANSPORT_NAME } from "~/api/constants.js";

class SaveSettingsUseCaseImpl implements SaveSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: SaveSettingsRepository.Interface,
        private codeSettings: CodeMailerSettings.Interface
    ) {}

    async execute(input: SaveSettingsInput): SaveSettingsUseCase.Return {
        const permission = await this.identityContext.getPermission(MAILER_SETTINGS_PERMISSION);

        if (!permission) {
            return Result.fail(new SettingsNotAuthorized());
        }

        const validationResult = saveValidation.safeParse(input);
        if (!validationResult.success) {
            return Result.fail(new SettingsValidationError(validationResult.error.issues));
        }

        // Settings from `Api.Mailer.Smtp` win over stored ones, so saving would change nothing.
        if (this.codeSettings.get(SMTP_TRANSPORT_NAME) !== null) {
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
    dependencies: [IdentityContext, EventPublisher, SaveSettingsRepository, CodeMailerSettings]
});
