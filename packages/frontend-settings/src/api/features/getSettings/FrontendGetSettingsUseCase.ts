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

        // Every Admin user can read the domain, because content previews are built from it.
        const { domain } = await this.repository.execute();
        return Result.ok({ domain });
    }
}

export const FrontendGetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: FrontendGetSettingsUseCaseImpl,
    dependencies: [IdentityContext, FrontendGetSettingsRepository]
});
