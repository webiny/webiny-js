import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { SaveSettingsUseCase, SaveSettingsRepository } from "./abstractions.js";
import { MailerSettingsBeforeSaveEvent, MailerSettingsAfterSaveEvent } from "./events.js";
import { TransportSettingsDefinition } from "~/domain/TransportSettings/abstractions.js";
import { findDefinition, withoutSecrets } from "~/domain/TransportSettings/findDefinition.js";
import {
    SettingsLockedByCode,
    SettingsNotAuthorized,
    SettingsPersistenceError,
    SettingsValidationError,
    UnknownTransportSettings
} from "~/domain/errors.js";
import { MAILER_SETTINGS_PERMISSION } from "~/constants.js";

class SaveSettingsUseCaseImpl implements SaveSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: SaveSettingsRepository.Interface,
        private definitions: TransportSettingsDefinition.Interface[]
    ) {}

    async execute(
        transport: string,
        input: TransportSettingsDefinition.Values
    ): SaveSettingsUseCase.Return {
        const permission = await this.identityContext.getPermission(MAILER_SETTINGS_PERMISSION);
        if (!permission) {
            return Result.fail(new SettingsNotAuthorized());
        }

        const definition = findDefinition(this.definitions, transport);
        if (!definition) {
            return Result.fail(new UnknownTransportSettings(transport));
        }

        const validationResult = definition.schema.safeParse(input);
        if (!validationResult.success) {
            return Result.fail(new SettingsValidationError(validationResult.error.issues));
        }
        const values = validationResult.data as TransportSettingsDefinition.Values;

        // Settings set in code win over stored ones, so saving would change nothing.
        if ((definition.getCodeSettings?.() ?? null) !== null) {
            return Result.fail(new SettingsLockedByCode());
        }

        await this.eventPublisher.publish(
            new MailerSettingsBeforeSaveEvent({
                transport,
                input: withoutSecrets(definition, values)
            })
        );

        const result = await this.repository.execute(definition, values);
        if (result.isFail()) {
            if (result.error instanceof SettingsValidationError) {
                return Result.fail(result.error);
            }
            return Result.fail(new SettingsPersistenceError(result.error));
        }

        await this.eventPublisher.publish(
            new MailerSettingsAfterSaveEvent({ transport, settings: result.value })
        );

        return result;
    }
}

export const SaveSettingsUseCaseImplementation = SaveSettingsUseCase.createImplementation({
    implementation: SaveSettingsUseCaseImpl,
    dependencies: [
        IdentityContext,
        EventPublisher,
        SaveSettingsRepository,
        [TransportSettingsDefinition, { multiple: true }]
    ]
});
