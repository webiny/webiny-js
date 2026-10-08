import { Result } from "@webiny/feature/api";
import {
    FrontendGetSettingsUseCase as UseCaseAbstraction,
    FrontendGetSettingsRepository
} from "./abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";

class FrontendGetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: FrontendGetSettingsRepository.Interface
    ) {}

    async execute(): UseCaseAbstraction.Return {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        const permission = await this.identityContext.getPermission(
            "dev-tools.frontend-settings.*"
        );
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        const { domain } = await this.repository.execute();
        return Result.ok({ domain });
    }
}

export const FrontendGetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: FrontendGetSettingsUseCaseImpl,
    dependencies: [IdentityContext, FrontendGetSettingsRepository]
});
