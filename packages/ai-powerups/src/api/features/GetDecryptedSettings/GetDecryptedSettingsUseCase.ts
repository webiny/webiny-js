import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { GetSettingsRepository } from "~/api/features/GetSettings/abstractions.js";
import { GetDecryptedSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetDecryptedSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private repository: GetSettingsRepository.Interface,
        private encryption: Encryption.Interface
    ) {}

    public async execute(): UseCaseAbstraction.Return {
        // Background tasks run as the identity that created them, so they are never anonymous.
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        const result = await this.repository.get();
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const settings = result.value;

        // The repository returns a cached object, so build new ones instead of mutating it.
        const presets = await Promise.all(
            (settings.connections?.presets ?? []).map(async preset => ({
                ...preset,
                apiKey: preset.apiKeyEncrypted
                    ? await this.encryption.decrypt(preset.apiKeyEncrypted)
                    : undefined
            }))
        );

        return Result.ok({
            ...settings,
            connections: {
                ...settings.connections,
                presets
            }
        });
    }
}

export const GetDecryptedSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetDecryptedSettingsUseCaseImpl,
    dependencies: [IdentityContext, GetSettingsRepository, Encryption]
});
