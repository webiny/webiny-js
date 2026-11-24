import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { SettingsNotAuthorized } from "~/domain/errors.js";
import {
    GetSettingsUseCase,
    GetSettingsRepository,
    type ISettingsWithSource
} from "./abstractions.js";

/**
 * Settings for the GraphQL API. Internal callers (e.g. MailerService) read them through
 * GetSettingsRepository.
 */
class GetSettingsUseCaseImpl implements GetSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: GetSettingsRepository.Interface
    ) {}

    async execute(
        transportName: string
    ): Promise<Result<ISettingsWithSource, SettingsNotAuthorized>> {
        const permission = await this.identityContext.getPermission("mailer.settings");
        if (!permission) {
            return Result.fail(
                new SettingsNotAuthorized("Not allowed to read the mailer settings.")
            );
        }

        return this.repository.get(transportName);
    }
}

export const GetSettingsUseCaseImplementation = GetSettingsUseCase.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [IdentityContext, GetSettingsRepository]
});
