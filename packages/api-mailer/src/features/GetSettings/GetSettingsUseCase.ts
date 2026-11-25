import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetSettingsUseCase, GetSettingsRepository } from "./abstractions.js";
import { TransportSettingsDefinition } from "~/domain/TransportSettings/abstractions.js";
import { findDefinition, withoutSecrets } from "~/domain/TransportSettings/findDefinition.js";
import { SettingsNotAuthorized, UnknownTransportSettings } from "~/domain/errors.js";
import { MAILER_SETTINGS_PERMISSION } from "~/constants.js";

class GetSettingsUseCaseImpl implements GetSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: GetSettingsRepository.Interface,
        private definitions: TransportSettingsDefinition.Interface[]
    ) {}

    async execute(transport: string) {
        const permission = await this.identityContext.getPermission(MAILER_SETTINGS_PERMISSION);
        if (!permission) {
            return Result.fail(
                new SettingsNotAuthorized("Not allowed to read the mailer settings.")
            );
        }

        const definition = findDefinition(this.definitions, transport);
        if (!definition) {
            return Result.fail(new UnknownTransportSettings(transport));
        }

        const result = await this.repository.get(transport);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const { settings, source } = result.value;
        return Result.ok({
            settings: settings ? withoutSecrets(definition, settings) : null,
            source
        });
    }
}

export const GetSettingsUseCaseImplementation = GetSettingsUseCase.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [
        IdentityContext,
        GetSettingsRepository,
        [TransportSettingsDefinition, { multiple: true }]
    ]
});
