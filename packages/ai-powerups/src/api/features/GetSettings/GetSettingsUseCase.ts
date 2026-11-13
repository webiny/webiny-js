import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { GetSettingsUseCase, GetSettingsRepository } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";

/**
 * Returns the settings without key material that the caller may not see:
 * the encrypted keys never, and the masked keys only to full access.
 * Internal code that needs the keys uses `GetDecryptedSettingsUseCase`.
 */
class GetSettingsUseCaseImpl implements GetSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: GetSettingsRepository.Interface
    ) {}

    async execute(): Promise<Result<IAiPowerUpsSettings, Error>> {
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        const result = await this.repository.get();
        if (result.isFail()) {
            return result;
        }

        const hasFullAccess = await this.identityContext.hasFullAccess();
        const settings = result.value;

        return Result.ok({
            ...settings,
            providers: {
                ...settings.providers,
                presets: (settings.providers?.presets ?? []).map(preset => ({
                    ...preset,
                    apiKey: undefined,
                    apiKeyEncrypted: "",
                    apiKeyMasked: hasFullAccess ? preset.apiKeyMasked : ""
                }))
            }
        });
    }
}

export const GetSettingsUseCaseImplementation = GetSettingsUseCase.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [IdentityContext, GetSettingsRepository]
});
