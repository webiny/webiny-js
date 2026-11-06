import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { GetSettingsRepository } from "~/api/features/GetSettings/abstractions.js";
import { GetDecryptedSettingsUseCase } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";

class GetDecryptedSettingsUseCaseImpl implements GetDecryptedSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: GetSettingsRepository.Interface,
        private encryption: Encryption.Interface
    ) {}

    async execute(): Promise<Result<IAiPowerUpsSettings, Error>> {
        // Background tasks run as the identity that created them, so they are never anonymous.
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        const result = await this.repository.get();
        if (result.isFail()) {
            return result;
        }

        const settings = result.value;
        const presets = await Promise.all(
            (settings.providers?.presets ?? []).map(async preset => ({
                ...preset,
                apiKey: preset.apiKeyEncrypted
                    ? await this.encryption.decrypt(preset.apiKeyEncrypted)
                    : undefined
            }))
        );

        return Result.ok({
            ...settings,
            providers: {
                ...settings.providers,
                presets
            }
        });
    }
}

export const GetDecryptedSettingsUseCaseImplementation =
    GetDecryptedSettingsUseCase.createImplementation({
        implementation: GetDecryptedSettingsUseCaseImpl,
        dependencies: [IdentityContext, GetSettingsRepository, Encryption]
    });
