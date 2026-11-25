import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { AiPowerUpsPermissions } from "~/api/features/permissions/index.js";
import { GetSettingsUseCase, GetSettingsRepository } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";

interface KeyHolder {
    apiKey?: string;
    apiKeyMasked: string;
    apiKeyEncrypted: string;
}

/**
 * Returns the settings without key material that the caller may not see:
 * the encrypted keys never, and the masked keys only with the `aiPowerups.settings` permission.
 * Internal code that needs the keys uses `GetDecryptedSettingsUseCase`.
 */
class GetSettingsUseCaseImpl implements GetSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private permissions: AiPowerUpsPermissions.Interface,
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

        const canSeeMaskedKeys = await this.permissions.canAccess("settings");
        const settings = result.value;

        // The repository returns a cached object, so build new ones instead of mutating it.
        const stripKeys = <T extends KeyHolder>(presets: T[] | undefined): T[] => {
            return (presets ?? []).map(preset => ({
                ...preset,
                apiKey: undefined,
                apiKeyEncrypted: "",
                apiKeyMasked: canSeeMaskedKeys ? preset.apiKeyMasked : ""
            }));
        };

        return Result.ok({
            ...settings,
            providers: {
                ...settings.providers,
                presets: stripKeys(settings.providers?.presets)
            },
            connections: {
                ...settings.connections,
                presets: stripKeys(settings.connections?.presets)
            }
        });
    }
}

export const GetSettingsUseCaseImplementation = GetSettingsUseCase.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [IdentityContext, AiPowerUpsPermissions, GetSettingsRepository]
});
